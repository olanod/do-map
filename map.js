const mbxVer = 'v0.51.0'
const mbxJS = `https://api.tiles.mapbox.com/mapbox-gl-js/${mbxVer}/mapbox-gl-dev.js`
const mbxCSS = `https://api.tiles.mapbox.com/mapbox-gl-js/${mbxVer}/mapbox-gl.css`
const mbxStyle = document.head.querySelector('meta[name=mapbox-style]') || 'mapbox://styles/mapbox/streets-v9'
const mbxToken = document.head.querySelector('meta[name=mapbox-token]')
const mapboxReady = loadMapbox(mbxJS)

export const mapbox = Symbol('mapbox')

export class Map extends HTMLElement {
  static get tag() { return 'do-map' }

  constructor() {
    super()
    this._center = [0, 0]
    this._zoom = parseInt(this.getAttribute('zoom')) || 0

    const css = document.createElement('style')
    css.append(document.createTextNode(`
    :host {display: block}
    #map {height: 100%; width: 100%;}
    `))

    const mcss = document.createElement('link')
    mcss.rel = 'stylesheet'
    mcss.href = mbxCSS

    const map = document.createElement('div')
    map.id = 'map'
    Object.defineProperty(this, '$map', { value: map })

    this.attachShadow({ mode: 'open' })
    this.shadowRoot.append(mcss, css, map)
  }

  async connectedCallback() {
    await mapboxReady
    this[mapbox] = new mapboxgl.Map({
      container: this.$map,
      style: mbxStyle,
      center: this._center,
      zoom: this._zoom,
    })
  }

  get zoom() { return this._zoom }
  set zoom(val) { set(this, 'zoom', val) }

  get center() { return this._center }
  set center(val) { set(this, 'center', val) }
}
customElements.define(Map.tag, Map)

export class Marker extends HTMLElement {
  static get tag() { return 'do-marker' }

  constructor() {
    super()
    this._lngLat = [
      parseInt(this.getAttribute('lng')) || 0, 
      parseInt(this.getAttribute('lat')) || 0,
    ]
  }

  async connectedCallback() {
    await mapboxReady
    this[mapbox] = new mapboxgl.Marker().setLngLat(this._lngLat)
    this.lngLat = this._lngLat
    const map = this.closest(Map.tag)
    if (map) this[mapbox].addTo(map[mapbox])
  }

  get lngLat() { return this._lngLat }
  set lngLat([lng, lat]) { set(this, 'lngLat', [lng || 0, lat || 0]) }
}
customElements.define(Marker.tag, Marker)

async function set(self, prop, val) {
  self[`_${prop}`] = val
  await mapboxReady
  requestAnimationFrame(() => {
    prop = prop.charAt(0).toUpperCase() + prop.slice(1)
    self[mapbox][`set${prop}`](val)
  })
}

async function loadMapbox(jsURL, cssURL) {
  await new Promise((res, rej) => {
    const script = document.createElement('script')
    script.onload = res
    script.src = jsURL
    document.head.append(script)
  })
  mapboxgl.accessToken = mbxToken.content
}