const ts = "2026-04-02T15:51:16.466571Z";
const date = new Date(ts);
console.log("Input:", ts);
console.log("Parsed Date:", date.toString());
console.log("Formatted:", date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
