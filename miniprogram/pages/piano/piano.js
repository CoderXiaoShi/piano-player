const { getAudio, loadAccess } = require('./utils/audio')
const Event = require('./utils/event')

let db = wx.cloud.database({
  env: `dev-enjcr`,
})
let collection = 'piano'
let _ = db.command
let groupId = ''
let roomType = 'create'
let roomMaster = null

/*
  数据结构
    piano 一张表即可完成房间，通信功能。 
    表字段 
      groupId 随机生成
      _openid 创建这条数据的人
      pianoKey 代表按下的琴键
      type: 代表这条数据的行为，create, joinRoom, keyDown
      sendTimeTS: 代表时序
      master: 房间的创建者
      user: 被邀请一起弹钢琴者
*/

Page({

  /**
   * 页面的初始数据
   */
  data: {
    index: 0,
    user: null,
    // user: {
      // avatarUrl: "https://thirdwx.qlogo.cn/mmopen/vi_32/ERopy2EtG2cKhLKSYHvnsnnD67Vh7z6A0qGGajcXtMuwcUOichYPUL1VOdheoPwo4nP98FSHztr5mZpjoDBSwtw/132",
      // nickName: '昵称'
    // },
    // userInfo: {
    //   avatarUrl: "https://thirdwx.qlogo.cn/mmopen/vi_32/ERopy2EtG2cKhLKSYHvnsnnD67Vh7z6A0qGGajcXtMuwcUOichYPUL1VOdheoPwo4nP98FSHztr5mZpjoDBSwtw/132",
    //   nickName: '昵称'
    // },
    userInfo: null,
    openId: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 预加载资源
    loadAccess()
    ;(async () => {
      if (options.groupId) {
        console.log('被邀请', options.groupId)
        try {
          // 被邀请
          groupId = options.groupId
          roomType = 'joinRoom'
          // 查询 master
          let master = await db.collection(collection).where({
            groupId,
            type: 'create',
          }).get()
          this.setData({
            user: master.data[0].master
          })
          roomMaster = master.data[0].master
        } catch (error) {
          console.log('加入房间失败',error)
        }
      } else {
        roomType = 'create'
        groupId = `piano-room-${Math.random().toString(32)}`
      }
      console.log('groupId: ', groupId);
    })();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '【一起弹钢琴】妹纸，可否一战～',
      path: `/pages/piano/piano?groupId=${groupId}`
    }
  },
  getUserInfo() {
    wx.getUserProfile({
      desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log('res: ', res.userInfo)
        // 登陆，拿到 openid
        this.login()
        this.setData({
          userInfo: res.userInfo
        })
        // 开始监听
        this.initWatch()
      }
    })
  },

  login() {
    wx.showLoading({
      title: '正在登陆...',
      mask: true
    })
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        wx.hideLoading()
        console.log('[云函数] [login] user openid: ', res.result)
        let openId = res.result.openid
        this.putKey('', roomType, openId)
        this.setData({ openId })
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        wx.navigateTo({
          url: '../deployFunctions/deployFunctions',
        })
      }
    })
  },

  initWatch: function() {
    db.collection(collection)
    .orderBy('sendTimeTS', 'desc')
    .limit(10)
    .where({
      groupId: groupId,
    })
    .watch({
      onChange: this.watchChange.bind(this),
      onError: function(err) {
        console.log(err)
      }
    })
  },

  playAudio: function(pianoKey) {
    let url = getAudio(pianoKey)
    let innerAudio = wx.createInnerAudioContext()
    innerAudio.autoplay = true;
    innerAudio.obeyMuteSwitch = false;
    innerAudio.src = url;
  },

  keyDown: function(e) {
    let pianoKey = e.detail
    this.playAudio(pianoKey)
    // 如果房间里只有一个人的话，不发同步按键数据
    if (this.data.user !== null) {
      this.putKey(pianoKey)
    }
  },
  /*
    头像，只展示对方头像
    推送数据中，拿到对方头像
  */
  watchChange: function(snapshot) {
    if (Array.isArray(snapshot.docChanges) && snapshot.docChanges.length > 0) {
      let { pianoKey, _openid, master, user } = snapshot.docChanges[0].doc
      // 创建者，拿到参与者头像
      if (master.openId === this.data.openId) {
        this.setData({
          user: user
        })
      }
      // 参与者，拿到创建者头像
      if (user.openId === this.data.openId) {
        this.setData({
          user: master
        })
      }
      if (_openid !== this.data.openId) {
        this.playAudio(pianoKey)
        Event.emit('autoKey', pianoKey)
      }
    } else {
      console.log(snapshot)
    }
  },

  putKey: function(key, type = 'keyDown', openId) {
    ;(async () => {
      let master = {}
      let user = {}
      if (roomType === 'create') {
        master = this.data.userInfo
        master.openId = openId
        user = this.data.user
      } else if (roomType === 'joinRoom') {
        master = roomMaster
        user = this.data.userInfo
        user.openId = openId
      }
      const doc = {
        _id: `${Math.random()}_${Date.now()}`,
        pianoKey: key,
        groupId: groupId,
        /*
          create 是创建
          joinRoom 是加入房间
          keyDown 是按键
        */
        type,
        // 房间主人
        master: master,
        // 被邀请的玩家
        user,
        sendTime: new Date(),
        sendTimeTS: Date.now(), // fallback
      }
  
      await db.collection(collection).add({
        data: doc,
      })

    })();

  }
})