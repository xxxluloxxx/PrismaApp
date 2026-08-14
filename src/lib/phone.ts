/**
 * Los teléfonos de `patients.phone` se capturan como texto libre y normalmente
 * usan el formato nacional ecuatoriano: 10 dígitos empezando en 0
 * (por ejemplo, 0987654321). Ecuador no requiere un marcado internacional
 * adicional, por lo que basta con anteponer el código de país 593.
 */
export function normalizeEcuadorPhone(
  raw: string | null | undefined
): string | null {
  const digits = raw?.replace(/\D/g, "") ?? "";
  let nationalNumber: string;

  if (digits.startsWith("593")) {
    nationalNumber = digits.slice(3);
  } else if (digits.startsWith("0")) {
    nationalNumber = digits.slice(1);
  } else {
    nationalNumber = digits;
  }

  if (nationalNumber.length < 8 || nationalNumber.length > 9) {
    return null;
  }

  return `593${nationalNumber}`;
}

export function isValidEcuadorPhone(
  raw: string | null | undefined
): boolean {
  return normalizeEcuadorPhone(raw) !== null;
}
