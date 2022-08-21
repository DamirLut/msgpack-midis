export function buff2hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((x) => x.toString(16).padStart(2, '0')).join(' ');
}

export function getBytesFromString(str: string) {
  return [...new TextEncoder().encode(str)];
}

export function binary(value: number) {
  var str = '';

  value
    .toString(2)
    .split('')
    .forEach((val, index) => {
      str += val;
      if (index % 2) {
        str += ' ';
      }
    });

  return str.trim();
}
window.binary = binary;
