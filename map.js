/* Copyright © 2018  Daniel Olano | @license GPLv3 */
const mbxVer = 'v0.53.1'
const mbxJS = `https://api.tiles.mapbox.com/mapbox-gl-js/${mbxVer}/mapbox-gl.js`
const mbxCSS = `https://api.tiles.mapbox.com/mapbox-gl-js/${mbxVer}/mapbox-gl.css`
const mbxStyle = 'mapbox://styles/mapbox/streets-v9'
const mbxToken = document.head.querySelector('meta[name=mapbox-token]').content

;(async () => {
	await loadMapbox(mbxJS, mbxToken)
	customElements.define(Map.tag, Map)
	customElements.define(Marker.tag, Marker)
})()

export const mapbox = Symbol('mapbox')

/**
 * Map
 */
export class Map extends HTMLElement {
	static get tag() { return 'd-map' }

	constructor() {
		super()
		this._center = parseCoords(this.getAttribute('c'))
		this._zoom = +this.getAttribute('z') || 0

		const css = document.createElement('style')
		css.append(document.createTextNode(`:host {display: block}
#map {height: 100%; width: 100%;}`))

		const mcss = document.createElement('link')
		mcss.rel = 'stylesheet'
		mcss.href = mbxCSS

		const map = document.createElement('div')
		map.id = 'map'
		Object.defineProperty(this, '$map', { value: map })

		this.attachShadow({ mode: 'open' })
		this.shadowRoot.append(mcss, css, map)
	}

	connectedCallback() {
		this[mapbox] = new mapboxgl.Map({
			container: this.$map,
			style: mbxStyle,
			center: this._center,
			zoom: this._zoom,
		})
	}

	set(prop, val) { setProp(this, prop, val) }

	get zoom() { return this._zoom }
	set zoom(val) { this.set('zoom', val) }

	get center() { return this._center }
	set center(val) { this.set('center', val) }
}


/**
 * Marker
 */
export class Marker extends HTMLElement {
	static get tag() { return 'd-marker' }

	constructor() {
		super()
		this._lngLat = parseCoords(this.getAttribute('c'))
	}

	async connectedCallback() {
		this[mapbox] = new mapboxgl.Marker().setLngLat(this._lngLat)
		this.lngLat = this._lngLat
		const map = this.closest(Map.tag)
		if (map) this[mapbox].addTo(map[mapbox])
	}

	get lngLat() { return this._lngLat }
	set lngLat([lng, lat]) { setProp(this, 'lngLat', [lng || 0, lat || 0]) }
}

function setProp(self, prop, val) {
	self[`_${prop}`] = val
	prop = prop.charAt(0).toUpperCase() + prop.slice(1)
	self[mapbox][`set${prop}`](val)
}

function parseCoords(str) {
	const c = `${str}`.split(' ').filter(c => !!c).map(c => +c)
	return c.length == 2 ? c : [0, 0]
}

async function loadMapbox(jsURL, token) {
	await new Promise((res, rej) => {
		const script = document.createElement('script')
		script.onload = res
		script.src = jsURL
		document.head.append(script)
	})
	mapboxgl.accessToken = token
}
