export function debounce(callback: (...args: any[]) => unknown, delay = 250) {
    let timeout: any;

    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback(...args), delay);
    };
}

export const escapeHTML = (unsafe: string) =>
    unsafe == '' || unsafe == null
        ? ''
        : unsafe.replace(/[&<"']/g, match => {
              switch (match) {
                  case '&':
                      return '&amp;';
                  case '<':
                      return '&lt;';
                  case '"':
                      return '&quot;';
                  case "'":
                      return '&apos;';
                  default:
                      return match;
              }
          });

export const moveToMacroQueue = (callback: () => void) => setTimeout(callback, 0);
