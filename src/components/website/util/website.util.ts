export function generateCertificationId(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let certificationId = '';
  for (let i = 0; i < 12; i++) {
    certificationId += characters.charAt(
      Math.floor(Math.random() * characters.length),
    );
  }
  return certificationId;
}
