export const setInitialErrorsWithFocusingElement = (
    formFieldNames: string[],
    initialErrorsRef: React.MutableRefObject<Record<string, string>>,
    setErrors: (errors: Record<string, string>) => void,
    formRef: React.MutableRefObject<HTMLFormElement | null>
) => {
    if (Object.keys(initialErrorsRef.current).length === 0) {
        return;
    }

    const newErrors: Record<string, string> = {};
    let focusElementName: string | null = null;
    formFieldNames.forEach((key) => {
        if (!initialErrorsRef.current[key]) {
            return;
        }

        newErrors[key] = initialErrorsRef.current[key];
        delete initialErrorsRef.current[key];
        if (!focusElementName) {
            focusElementName = key;
        }
    });

    if (Object.keys(newErrors).length === 0) {
        return;
    }

    setErrors(newErrors);
    if (focusElementName) {
        setTimeout(() => {
            formRef.current?.[focusElementName!]?.focus();
        }, 0);
    }
};
