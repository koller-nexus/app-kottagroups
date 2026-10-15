/** Limites que a API aplica à foto de perfil; checados antes de enviar. */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Mensagem do problema com o arquivo escolhido, ou null se ele pode ser enviado. */
export function avatarFileProblem(file: { type: string; size: number } | null): string | null {
  if (!file || file.size === 0) return "Escolha uma foto.";
  if (!AVATAR_TYPES.includes(file.type) || file.size > AVATAR_MAX_BYTES) {
    return "Use uma foto JPG, PNG ou WebP de até 5 MB";
  }
  return null;
}
