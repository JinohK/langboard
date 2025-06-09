# Copyright (c) 2017-present, Encode OSS Ltd. All rights reserved.
#
# This file is derived from the original `supervisors/multiprocess.py` file in the Uvicorn project,
# available at: https://github.com/encode/uvicorn
#
# Licensed under the BSD 3-Clause License. Redistribution and use in source and binary
# forms, with or without modification, are permitted provided that the following
# conditions are met:
#
# 1. Redistributions of source code must retain the above copyright notice, this list
#    of conditions and the following disclaimer.
# 2. Redistributions in binary form must reproduce the above copyright notice, this list
#    of conditions and the following disclaimer in the documentation and/or other
#    materials provided with the distribution.
# 3. Neither the name of the copyright holder nor the names of its contributors
#    may be used to endorse or promote products derived from this software without
#    specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
# ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
# IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
# INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
# NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
# PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
# WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
# ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY
# OF SUCH DAMAGE.
#
# ---
# Modified by [Yamon], 2025
# Purpose: Custom server runner using multiprocessing.Queue support and change logging.


from __future__ import annotations
import logging
import os
import signal
import threading
from multiprocessing import Pipe
from socket import socket
from typing import Any, Callable
import click
from uvicorn.config import Config
from ....broadcast import DispatcherQueue
from .._subprocess import get_subprocess, run_broker


SIGNALS = {
    getattr(signal, f"SIG{x}"): x
    for x in "INT TERM BREAK HUP QUIT TTIN TTOU USR1 USR2 WINCH".split()
    if hasattr(signal, f"SIG{x}")
}

logger = logging.getLogger("uvicorn.error")


class Process:
    def __init__(
        self,
        config: Config,
        target: Callable[[list[socket] | None], None],
        sockets: list[socket],
    ) -> None:
        self.real_target = target

        self.parent_conn, self.child_conn = Pipe()
        self.process = get_subprocess(config, self.target, sockets)

    def ping(self, timeout: float = 5) -> bool:
        self.parent_conn.send(b"ping")
        if self.parent_conn.poll(timeout):
            self.parent_conn.recv()
            return True
        return False

    def pong(self) -> None:
        self.child_conn.recv()
        self.child_conn.send(b"pong")

    def always_pong(self) -> None:
        while True:
            self.pong()

    def target(self, sockets: list[socket] | None = None) -> Any:  # pragma: no cover
        if os.name == "nt":  # pragma: py-not-win32
            # Windows doesn't support SIGTERM, so we use SIGBREAK instead.
            # And then we raise SIGTERM when SIGBREAK is received.
            # https://learn.microsoft.com/zh-cn/cpp/c-runtime-library/reference/signal?view=msvc-170
            signal.signal(
                signal.SIGBREAK,  # type: ignore[attr-defined]
                lambda sig, frame: signal.raise_signal(signal.SIGTERM),
            )

        threading.Thread(target=self.always_pong, daemon=True).start()
        return self.real_target(sockets)

    def is_alive(self, timeout: float = 5) -> bool:
        if not self.process.is_alive():
            return False  # pragma: full coverage

        return self.ping(timeout)

    def start(self) -> None:
        self.process.start()

    def terminate(self) -> None:
        if self.process.exitcode is None:  # Process is still running
            assert self.process.pid is not None
            if os.name == "nt":  # pragma: py-not-win32
                # Windows doesn't support SIGTERM.
                # So send SIGBREAK, and then in process raise SIGTERM.
                os.kill(self.process.pid, signal.CTRL_BREAK_EVENT)  # type: ignore[attr-defined]
            else:
                os.kill(self.process.pid, signal.SIGTERM)
            logger.info(f"Terminated child process [{self.process.pid}]")

            self.parent_conn.close()
            self.child_conn.close()

    def kill(self) -> None:
        # In Windows, the method will call `TerminateProcess` to kill the process.
        # In Unix, the method will send SIGKILL to the process.
        self.process.kill()

    def join(self) -> None:
        logger.info(f"Waiting for child process [{self.process.pid}]")
        self.process.join()

    @property
    def pid(self) -> int | None:
        return self.process.pid


class Multiprocess:
    def __init__(
        self,
        config: Config,
        target: Callable[[list[socket] | None], None],
        sockets: list[socket],
    ) -> None:
        self.config = config
        self.target = target
        self.sockets = sockets

        self.processes_num = config.workers
        self.processes: list[Process] = []

        self.should_exit = threading.Event()

        self.signal_queue: list[int] = []
        for sig in SIGNALS:
            signal.signal(sig, lambda sig, frame: self.signal_queue.append(sig))

        DispatcherQueue.start()

    def init_processes(self) -> None:
        for idx in range(self.processes_num):
            process = Process(self.config, self.target, self.sockets)
            process.start()
            self.processes.append(process)
        self.broker_process = run_broker(is_restarting=False)

    def terminate_all(self) -> None:
        for process in self.processes:
            process.terminate()
        self.broker_process.terminate()
        self.broker_process.kill()

    def join_all(self) -> None:
        for process in self.processes:
            process.join()
        self.broker_process.join()

    def restart_all(self) -> None:
        for idx, process in enumerate(self.processes):
            process.terminate()
            process.join()
            new_process = Process(self.config, self.target, self.sockets)
            new_process.start()
            self.processes[idx] = new_process
        self.broker_process.terminate()
        self.broker_process.kill()
        self.broker_process.join()
        self.broker_process = run_broker(is_restarting=True)

    def run(self) -> None:
        message = f"Started parent process [{os.getpid()}]"
        color_message = "Started parent process [{}]".format(click.style(str(os.getpid()), fg="cyan", bold=True))
        logger.info(message, extra={"color_message": color_message})

        self.init_processes()

        while not self.should_exit.wait(0.5):
            self.handle_signals()
            self.keep_subprocess_alive()

        self.terminate_all()
        self.join_all()

        message = f"Stopping parent process [{os.getpid()}]"
        color_message = "Stopping parent process [{}]".format(click.style(str(os.getpid()), fg="cyan", bold=True))
        logger.info(message, extra={"color_message": color_message})

    def keep_subprocess_alive(self) -> None:
        if self.should_exit.is_set():
            return  # parent process is exiting, no need to keep subprocess alive

        for idx, process in enumerate(self.processes):
            if process.is_alive():
                continue

            process.kill()  # process is hung, kill it
            process.join()

            if self.should_exit.is_set():
                return  # pragma: full coverage

            logger.info(f"Child process [{process.pid}] died")
            process = Process(self.config, self.target, self.sockets)
            process.start()
            self.processes[idx] = process

        if not self.broker_process.is_alive():
            self.broker_process.terminate()
            self.broker_process.kill()
            self.broker_process.join()
            self.broker_process = run_broker(is_restarting=True)

    def handle_signals(self) -> None:
        for sig in tuple(self.signal_queue):
            self.signal_queue.remove(sig)
            sig_name = SIGNALS[sig]
            sig_handler = getattr(self, f"handle_{sig_name.lower()}", None)
            if sig_handler is not None:
                sig_handler()
            else:  # pragma: no cover
                logger.debug(f"Received signal {sig_name}, but no handler is defined for it.")

    def handle_int(self) -> None:
        logger.info("Received SIGINT, exiting.")
        self.should_exit.set()

    def handle_term(self) -> None:
        logger.info("Received SIGTERM, exiting.")
        self.should_exit.set()

    def handle_break(self) -> None:  # pragma: py-not-win32
        logger.info("Received SIGBREAK, exiting.")
        self.should_exit.set()

    def handle_hup(self) -> None:  # pragma: py-win32
        logger.info("Received SIGHUP, restarting processes.")
        self.restart_all()

    def handle_ttin(self) -> None:  # pragma: py-win32
        logger.info("Received SIGTTIN, increasing the number of processes.")
        self.processes_num += 1
        process = Process(self.config, self.target, self.sockets)
        process.start()
        self.processes.append(process)

    def handle_ttou(self) -> None:  # pragma: py-win32
        logger.info("Received SIGTTOU, decreasing number of processes.")
        if self.processes_num <= 1:
            logger.info("Already reached one process, cannot decrease the number of processes anymore.")
            return
        self.processes_num -= 1
        process = self.processes.pop()
        process.terminate()
        process.join()
