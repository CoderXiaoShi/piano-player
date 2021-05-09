// components/pianoKeys/pianoKeys.js

const Event = require('../../pages/piano/utils/event')

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    openid: String,
    class: String,
    disable: Boolean,
  },

  /**
   * 组件的初始数据
   */
  data: {
    whiteKeys: ['1', '2', '3', '4', '5', '6', '7'],
    blackKeys: ['11', '22', '33', '44', '55', '66', '77'],
    keyDownMap: {
      // '3': '3'
    },
  },
  lifetimes: {
    attached() {
      console.log('组建 attached', this.data.disable)
      if (this.data.disable) {
        Event.on('autoKey', this.autoKey.bind(this))
      }
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    autoKey(e) {
      console.log('自动按键', e)
      this.keysUpOrDown(e[0])
      setTimeout(() => {
        this.keysUpOrDown(e[0])
      }, 200)
    },
    keysUpOrDown (key) {
      let newKeyDownMap = {...this.data.keyDownMap}
      if (newKeyDownMap[key]) {
        delete newKeyDownMap[key]
      } else {
        newKeyDownMap[key] = key
      }
      this.setData({
        keyDownMap: newKeyDownMap
      })
    },
    touchStart(e) {
      const { key } = e.currentTarget.dataset
      if (!this.data.disable) {
        this.keysUpOrDown(key)
        this.triggerEvent('keyDown', key)
      }
    },
    touchEnd(e) {
      if (!this.data.disable) {
        this.keysUpOrDown(e.currentTarget.dataset.key)
      }
    }
  },
  
})
