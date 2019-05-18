import "./index.css";
import MyAudio from "./audio";
import { resolve } from "path";
import { rejects } from "assert";
interface idArray {
  id: number;
}
const testSong = {
  title: "不要说话",
  src:
    "/music/20190518120140/543fe472df8ef9e5d33fc8fb5a12c84e/ymusic/0fd6/4f65/43ed/a8772889f38dfcb91c04da915b301617.mp3",
  artist: "陈奕迅"
};
let musicID: number[];
function getUrl(idArray: number[]): Promise<any> {
  let idString: string = "";
  for (let i = 0; i < 10; i++) {
    idString += idArray[i];
    if (i != 9) {
      idString += ",";
    }
  }
  console.log(idString);
  const getUrl = fetch(
    `/api/song/url?id=${idString}&proxy=http://127.0.0.1:6666`
  )
    .then(response => {
      return response.json();
    })
    .then(myJson => {
      return (<any[]>myJson.data).map(data => {
        return {
          src: (<string>data.url).replace("http://m10.music.126.net", "/music"),
          title: "不要说话",
          artist: "陈奕迅"
        };
      });
    });
  return getUrl;
}
let myAudio;
fetch("/api/playlist/detail?id=24381616&proxy=http://127.0.0.1:6666")
  .then(response => {
    return response.json();
  })
  .then(myJson => {
    musicID = (<idArray[]>myJson.playlist.trackIds).map(idItem => {
      return idItem.id;
    });
    return getUrl(musicID);
  })
  .then(value => {
    const myAudio = new MyAudio(value, {
      bar: document.querySelector(".basebar") as HTMLSpanElement,
      pause: document.querySelector(".btn1") as HTMLSpanElement,
      nextSong: document.querySelector(".btn2") as HTMLSpanElement,
      speedUp: document.querySelector(".btn3") as HTMLSpanElement
    });
  });

// const myAudio = new MyAudio([testSong], {
//   bar: document.querySelector(".basebar") as HTMLSpanElement,
//   pause: document.querySelector(".btn1") as HTMLSpanElement,
//   nextSong: document.querySelector(".btn2") as HTMLSpanElement,
//   speedUp: document.querySelector(".btn3") as HTMLSpanElement
// });
