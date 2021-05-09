
const whiteToFileMap = {
  1: 'C4', 
  2: 'D4', 
  3: 'E4', 
  4: 'F4', 
  5: 'G4', 
  6: 'A4', 
  7: 'B4',
}
const blackToFileMap = {
  '11': 'Cs4', 
  '22': 'Ds4', 
  '33': 'Fs4', 
  '44': null, 
  '55': 'Gs4', 
  '66': 'As4',
}

const loadFile = (path) => {
  return new Promise(() => {
    let audioContext = wx.createInnerAudioContext()
    audioContext.src = path
    audioContext.seek(audioContext.duration)
    audioContext.onWaiting(function(e) {
      console.log('加载静态资源', e)
    })
  })
}

const loadAccess = (onProcess) => {
  let accessList = []
  let rate = 0
  for (let key in whiteToFileMap) {
    let filePath = getAudio(key)
    accessList.push(filePath)
  }
  for (let key in blackToFileMap) {
    let filePath = getAudio(key)
    accessList.push(filePath)
  }
  for (let filePath of accessList) {
    loadFile(filePath);
  }
  return {
    accessList
  }
}

const getAudio = (key) => {
  let filename = whiteToFileMap[key] || blackToFileMap[key]
  if (filename) {
    return `cloud://dev-enjcr.6465-dev-enjcr-1302018995/pianoAudio/${filename}.mp3`
  }
  return false
}

module.exports = {
  getAudio,
  loadAccess
}