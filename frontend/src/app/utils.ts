export function debounce(callback: (...args: any[]) => unknown, delay = 250) {
    let timeout: any;

    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback(...args), delay);
    };
}
