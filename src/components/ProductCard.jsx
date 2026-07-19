export default function ProductCard({ producto, onClick }) {
  const { nombre, precio, imagen_url, categorias, subcategorias, disponible, cantidad } = producto
  const agotado = !disponible || cantidad === 0

  return (
    <button className="product-card" onClick={() => onClick(producto)}>
      <div className={`product-card__image-wrap ${!imagen_url ? 'no-image' : ''}`}>
        {imagen_url ? (
          <img src={imagen_url} alt={nombre} loading="lazy" />
        ) : (
          <span>Sin foto</span>
        )}
        <div className="product-card__tags">
          {categorias?.nombre && <span className="tag">{categorias.nombre}</span>}
          {subcategorias?.nombre && <span className="tag tag--sage">{subcategorias.nombre}</span>}
        </div>
        {agotado && <div className="badge-agotado">Agotado</div>}
      </div>
      <div className="product-card__body">
        <h3 className="product-card__name">{nombre}</h3>
        <span className="product-card__price">${Number(precio).toFixed(2)}</span>
        {!agotado && typeof cantidad === 'number' && (
          <span className="product-card__stock">Quedan {cantidad}</span>
        )}
      </div>
    </button>
  )
}
