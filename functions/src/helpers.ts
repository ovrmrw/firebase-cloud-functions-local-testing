export function logger(message: any, ...optionParams: any[]): void {
  const isTestMode = process.env.NODE_ENV === 'test';
  if (isTestMode) {
    console.log(message, ...optionParams);
  }
}
