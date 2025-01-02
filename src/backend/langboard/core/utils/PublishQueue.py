from multiprocessing import Queue


class PublishQueue:
    def __init__(self):
        self.queue = Queue()
        
    def comsume(self):