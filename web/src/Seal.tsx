/** Her seal (月薔), used as the site's mark. */
export function Seal({ large = false }: { large?: boolean }) {
  return (
    <span className={large ? "seal seal-large" : "seal"} aria-hidden="true">
      月薔
    </span>
  )
}
