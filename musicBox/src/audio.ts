interface song {
  title: string;
  duration?: number;
  artist: string;
  src: string;
  source?: AudioBufferSourceNode;
  lrc?: string;
  img?: ImageData; //不知道是不是这样用
}
interface songStatus {
  paused: boolean;
  speed: number;
  loop: boolean;
  volume: number;
  mute: boolean;
  currentTime: number;
}
interface ImyAudio {
  songList: Array<song>;
  songStatus: songStatus;
  pausedOrStart: () => void;
  changeCurrentTime: (time: number) => void;
  changePlaySpeed: (speed: number) => void;
  changeToSong: (songIndex: number | string) => void;
}
interface htmlElement {
  bar: HTMLSpanElement;
  pause: HTMLSpanElement;
  nextSong: HTMLSpanElement;
  speedUp: HTMLSpanElement;
}
type songStatusPara1 =
  | "paused"
  | "speed"
  | "loop"
  | "volume"
  | "mute"
  | "currentTime"
  | undefined;
type songStatusPara2<T> = T extends "paused"
  ? boolean
  : T extends "speed"
  ? number
  : T extends "loop"
  ? boolean
  : T extends "volume"
  ? number
  : T extends "mute"
  ? boolean
  : T extends "currentTime"
  ? number
  : null;
type myAudioEvent =
  | "changePlayStatus"
  | "changeSpeed"
  | "changeLoop"
  | "changeVolume"
  | "changeMute"
  | "changeCurTime"
  | "changeSong";
// import Promise from "./myPromise/src/core/promise";
import { Promise } from "es6-promise";
import { EventEmitter } from "eventemitter3";
import { resolve } from "url";
import { rejects } from "assert";
const eventEmitter = new EventEmitter();
const defaultSongStatus: songStatus = {
  paused: true,
  speed: 1.0,
  loop: false,
  volume: 1.0,
  mute: false,
  currentTime: 0.0
};
export default class myAudio implements ImyAudio {
  private htmlElement: htmlElement;
  private _songList: Array<song> = [];
  private _songStatus!: songStatus;
  private _songNow: number;
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private timerID: number;
  constructor(songList: Array<song>, htmlElement: htmlElement) {
    const AudioContext = window.AudioContext;
    this.songList = songList;
    this.songStatus = defaultSongStatus;
    this._songNow = -1;
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.htmlElement = htmlElement;
    this.timerID = 0;
    this.initial();
  }
  private initial() {
    this.registEvent();
    this.registElement();
    this.iniSong(0);
  }
  public get songList(): Array<song> {
    return this._songList;
  }
  public get songStatus(): songStatus {
    return this._songStatus;
  }
  private get songNow(): song {
    return this.songList[this._songNow];
  }
  public set songStatus(songStatus: songStatus) {
    this._songStatus = songStatus;
  }
  public set songList(songList: Array<song>) {
    this._songList = songList;
    this.emitEvent("changePlayStatus");
  }
  private setSongStatus<T extends songStatusPara1>(
    statusName?: T,
    status?: songStatusPara2<T>
  ) {
    let curSongStatus = this.songStatus;
    let changedStatus: songStatus;
    if (statusName === undefined) {
      this.setSongStatus("paused", false);
      this.setSongStatus("currentTime", 0);
    } else {
      this.songStatus = {
        ...curSongStatus,
        ...{ [statusName as string]: status }
      };
      switch (statusName) {
        case "currentTime":
          this.emitEvent("changeCurTime");
          break;
        case "mute":
          this.emitEvent("changeMute");
          break;
        case "paused":
          this.emitEvent("changePlayStatus");
          break;
        case "speed":
          this.emitEvent("changeSpeed");
          break;
        case "volume":
          this.emitEvent("changeVolume");
          break;
        default:
          break;
      }
    }
  }
  private setSongNow<T extends number | string>(index: T) {
    let songNum: number = -1;
    if (typeof index === "number") {
      songNum = index;
    } else if (typeof index === "string") {
      this.songList.forEach((song, number) => {
        if (song.title === index) {
          songNum = number;
        }
      });
      if (songNum < 0) {
        console.log("无法找到歌曲");
        return;
      }
    } else {
      return;
    }
    this._songNow = songNum;
    this.emitEvent("changeSong");
  }

  private iniSong<T>(index: T): Promise<void> {
    let src: string;
    let songNum: number = -1;
    if (typeof index === "number") {
      src = this.songList[index].src;
      songNum = index;
    } else if (typeof index === "string") {
      this.songList.forEach((song, number) => {
        if (song.title === index) {
          src = song.src;
          songNum = number;
        }
      });
      if (songNum < 0) {
        console.log("无法找到歌曲");
        return Promise.reject("无法找到歌曲");
      }
    } else {
      return Promise.reject("错误输入");
    }
    if (this.songList[songNum].source) {
      return Promise.resolve();
    }
    const iniPromise = this.getBuffer(src!).then(
      buffer => {
        this.songList[songNum].source = this.audioContext.createBufferSource();
        this.songList[songNum].source!.buffer = buffer;
        this.songList[songNum].duration = buffer.duration;
        return;
      },
      reason => {
        return Promise.reject(reason);
      }
    );
    return iniPromise;
  }
  private getBuffer(src: string): Promise<AudioBuffer> {
    const audioContext = this.audioContext;
    const myFetch = new Promise<AudioBuffer>((resolve, reject) => {
      fetch(src, {
        method: "GET"
      })
        .then(Response => Response.arrayBuffer())
        .then(arrayBuffer => {
          audioContext.decodeAudioData(arrayBuffer, buffer =>
            buffer ? resolve(buffer) : reject("decode失败")
          );
        });
    });
    return myFetch;
  }
  private play(index: number = 0): Promise<void> {
    const audioContext = this.audioContext;
    const song = this.songList[index];
    const gainNode = this.gainNode;
    clearInterval(this.timerID);
    return this.iniSong(index).then(() => {
      this._songStatus.currentTime = 0;
      this.timerID = window.setInterval(() => {
        if (this.songStatus.paused) {
          return;
        }
        this._songStatus.currentTime +=
          1 * this.songNow.source!.playbackRate.value;
      }, 1000);
      song.source!.onended = () => {
        this.changeToSong(this._songNow + 1);
      };
      song.source!.connect(gainNode).connect(audioContext.destination);
      song.source!.start();
    });
  }
  private registEvent() {
    eventEmitter.on("changePlayStatus", this.changePlayStatus.bind(this));
    eventEmitter.on("changeSpeed", this.changeSpeed.bind(this));
    eventEmitter.on("changeVolume", this.changeVolume.bind(this));
    eventEmitter.on("changeMute", this.changeMute.bind(this));
    eventEmitter.on("changeCurTime", this.changeCurTime.bind(this));
    eventEmitter.on("changeSong", this.changeSong.bind(this));
  }
  private emitEvent(str: myAudioEvent) {
    console.log(str);

    eventEmitter.emit(str);
  }
  private changePlayStatus() {
    console.log("changePlayStatus");
    if (this.songStatus.paused) {
      this.audioContext.suspend();
      this.htmlElement.pause.classList.replace("m-pause", "m-play");
    } else {
      this.audioContext.resume();
      this.htmlElement.pause.classList.replace("m-play", "m-pause");
    }
  }
  private changeSpeed() {
    this.songNow.source!.playbackRate.value = this.songStatus.speed;
  }
  private changeVolume() {
    this.gainNode.gain.value = this.songStatus.volume;
  }
  private changeMute() {
    if (this.songStatus.mute) {
      this.gainNode.gain.value = 0;
    } else {
      this.gainNode.gain.value = this.songStatus.volume;
    }
  }
  private changeCurTime() {
    this.songNow.source!.start(this.songStatus.currentTime);
  }
  private changeSong() {
    console.log("changSong");
    this.play(this._songNow).then(() => {
      this.setSongStatus();
    });
  }
  pausedOrStart() {
    if (this._songNow < 0) {
      this.changeToSong(0);
      return;
    }
    if (this.songStatus.paused) {
      this.setSongStatus("paused", false);
    } else {
      this.setSongStatus("paused", true);
    }
  }
  changeCurrentTime(time: number) {
    this.setSongStatus("currentTime", time);
  }
  changePlaySpeed(speed: number) {
    this.setSongStatus("speed", speed);
  }
  changeToSong(index: number | string) {
    if (this._songNow >= 0) {
      this.songNow.source!.disconnect(this.gainNode);
    }
    this.setSongNow(index);
  }
  private registElement() {
    setInterval(() => {
      if (!this.songNow || !this.songNow.source) {
        return;
      }
      this.htmlElement.bar.querySelector("span")!.style.width =
        (
          (this.songStatus.currentTime / this.songNow.duration!) *
          400
        ).toString() + "px";
    }, 1000);
    this.htmlElement.pause.addEventListener("click", () => {
      this.pausedOrStart();
    });
    this.htmlElement.speedUp.addEventListener("click", () => {
      if (this.songStatus.speed < 1.3) {
        this.setSongStatus("speed", this.songStatus.speed + 0.1);
      } else {
        this.setSongStatus("speed", 1);
      }
    });
    this.htmlElement.nextSong.addEventListener("click", () => {
      if (this._songNow < 8) {
        this.changeToSong(this._songNow + 1);
      }
    });
  } //循环列表
}
