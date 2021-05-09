class Event {
  constructor() {
    this.map = Object.create(null)
  }
  on(key, fn) {
    let fns = this.map[key]
    if (Array.isArray(fns)) {
      fns.push(fn)
    } else {
      this.map[key] = [fn]
    }
  }
  emit(key, ...args) {
    let fns = this.map[key]
    if (Array.isArray(fns)) {
      fns.map(fn => fn(args))
    }
  }
  remove(key, fn) {
    let fns = this.map[key]
    if (Array.isArray(fns)) {
      let index = fns.findIndex(fnItem => fnItem === fn)
      if (index !== -1) {
        fns.splice(index, 1)
      }
    }
  }
}

module.exports = new Event()