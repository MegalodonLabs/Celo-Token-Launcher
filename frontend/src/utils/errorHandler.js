import { toast } from "react-toastify";

/**
 * Exibe um toast de erro amigável com código identificador e loga detalhes no console.
 * @param {Error|any} error - O erro capturado
 * @param {string} [context] - Contexto opcional para log/debug
 */
export function handleAppError(error, context = "") {
  let errorMessage = "";
  let errorCode = "TX-UNKNOWN";
  const errorString = String(error).toLowerCase();

  if (
    errorString.includes("user rejected") ||
    errorString.includes("user denied") ||
    errorString.includes("rejected") ||
    errorString.includes("canceled by user")
  ) {
    errorMessage = "Transação cancelada pelo usuário";
    errorCode = "TX-REJECTED";
  } else if (errorString.includes("insufficient funds")) {
    errorMessage = "Saldo insuficiente para criar o token";
    errorCode = "TX-INSUFFICIENT";
  } else if (errorString.includes("gas required exceeds")) {
    errorMessage = "Erro de gas na transação. Tente aumentar o limite de gas";
    errorCode = "TX-GAS";
  } else {
    errorMessage = "Erro ao criar token. Por favor, tente novamente";
    errorCode = "TX-UNKNOWN";
  }

  toast.error(`${errorMessage} (Código: ${errorCode})`, {
    position: "top-right",
    autoClose: 6000,
    style: {
      background: '#FEE2E2',
      color: '#991B1B',
      borderRadius: '0.375rem',
      border: '1px solid #FCA5A5'
    },
  });

  // Log detalhado para debug
  console.error(`[${errorCode}] ${context}`, error);

  return errorCode;
}
