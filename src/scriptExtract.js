// @ts-nocheck
function generateVideo(finalData) {
  let params = {};
  for (let i = 0; i < finalData.workflowData.timeline.length; i++) {
    for (let j = 0; j < finalData.workflowData.timeline[i].steps.length; j++) {
      // MJ视频流
      if (!finalData.createType || finalData.createType !== "sd") {
        if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-6699e9cb-a927-481c-bdd3-e2f58343d174"
        ) {
          let temp = JSON.parse(JSON.stringify(finalData));
          let obj = JSON.parse(temp.workflowData.timeline[i].steps[j].value);
          let a = {};
          if (Object.prototype.toString.call(obj) === "[object Array]") {
            a = obj[0];
          } else if (
            Object.prototype.toString.call(obj) === "[object Object]"
          ) {
            a = obj;
          }
          for (let q = 0; q < a.shots.length; q++) {
            a.shots[q].shot_number = parseInt(a.shots[q].shot_number);
            if (!a.shots[q].image.image_prompt.includes(" --v 6")) {
              a.shots[q].image.image_prompt += " --v 6";
            }
            a.shots[q].image.image_prompt += " --sw " + 80;
          }
          params.videoInput = a;
        } else if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-7b109e1c-2f7a-4d78-9d35-e45408749e89"
        ) {
          let obj = {};
          if (
            Object.prototype.toString.call(
              JSON.parse(finalData.workflowData.timeline[i].steps[j].value)
            ) === "[object Array]"
          ) {
            obj = JSON.parse(
              finalData.workflowData.timeline[i].steps[j].value
            )[0];
          } else if (
            Object.prototype.toString.call(
              JSON.parse(finalData.workflowData.timeline[i].steps[j].value)
            ) === "[object Object]"
          ) {
            obj = JSON.parse(
              finalData.workflowData.timeline[i].steps[j].value
            )[0];
          }
          for (let k in obj) {
            // console.log(k)
            // console.log(obj[k])
            if (!obj[k].prompt.includes(" --v 6")) {
              obj[k].prompt += " --v 6";
            }
          }
          obj[finalData.mainCharacterName].url = finalData.mainCharacterUrl;
          // console.log(obj)
          params.characterMap = obj;
        } else if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-10fa6c04-bbef-4172-b851-cfda07095dab"
        ) {
          params.options = {
            svd: {
              fps: 12,
              motionBucketId: 90,
              high_motionBucketId: 90,
            },
            minimax: {
              vol: 1,
              speed: 1,
            },
          };
          if (
            Object.prototype.toString.call(
              JSON.parse(finalData.workflowData.timeline[i].steps[j].value)
            ) === "[object Array]"
          ) {
            params.options.background_music = JSON.parse(
              finalData.workflowData.timeline[i].steps[j].value
            ).name[0];
          } else if (
            Object.prototype.toString.call(
              JSON.parse(finalData.workflowData.timeline[i].steps[j].value)
            ) === "[object Object]"
          ) {
            params.options.background_music = JSON.parse(
              finalData.workflowData.timeline[i].steps[j].value
            ).name;
          }
        } else if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-49770322-3526-4245-a87a-a68148e93a6b"
        ) {
          params.voiceMap = [];
          let temp = JSON.parse(
            finalData.workflowData.timeline[i].steps[j].value
          );
          if (Object.prototype.toString.call(temp === "[object Array]")) {
            params.voiceMap = temp;
          } else {
            params.voiceMap = JSON.parse("[" + temp + "]");
          }
          for (let i = 0; i < temp.length; i++) {
            params.voiceMap[temp[i].characterName] = temp[i].id;
          }
        } else if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-1c8167f7-82bc-4d6a-a845-78fdf8047827"
        ) {
          let temp = JSON.parse(JSON.stringify(finalData));
          let obj = JSON.parse(temp.workflowData.timeline[i].steps[j].value);
          let a = [];
          if (Object.prototype.toString.call(obj) === "[object Array]") {
            a = obj[0].shots;
          } else if (
            Object.prototype.toString.call(obj) === "[object Object]"
          ) {
            a = obj.shots;
          }
          console.log(a);
          let arr = [];
          for (let i = 0; i < a.length; i++) {
            if (a[i].sound_effect_description !== "") {
              arr.push(a[i]);
            }
          }
          params.soundEffects = arr;
        }
      }

      //SD视频流
      if (finalData.createType === "sd") {
        if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-6699e9cb-a927-481c-bdd3-e2f58343d174"
        ) {
          // params.videoInput = JSON.parse(finalData.workflowData.timeline[i].steps[j].value)
          let temp = JSON.parse(JSON.stringify(finalData));
          let obj = JSON.parse(temp.workflowData.timeline[i].steps[j].value);
          let a = {};
          if (Object.prototype.toString.call(obj) === "[object Array]") {
            a = obj[0];
          } else if (
            Object.prototype.toString.call(obj) === "[object Object]"
          ) {
            a = obj;
          }
          for (let q = 0; q < a.shots.length; q++) {
            a.shots[q].shot_number = parseInt(a.shots[q].shot_number);
            // for (let t = 0; t < finalData.characterList.length; t++) {
            //   if (a.shots[q].image.actor === finalData.characterList[t].name) {
            //     a.shots[q].image.image_prompt += ',' + finalData.characterList[t].triggerWord + ',' + finalData.characterList[t].lora
            //   }
            // }
          }
          params.videoInput = a;
        } else if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-0b964f34-4c02-4a08-99aa-56b5f942f94d"
        ) {
          params.characterMap = JSON.parse(
            finalData.workflowData.timeline[i].steps[j].value
          );
        } else if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-10fa6c04-bbef-4172-b851-cfda07095dab"
        ) {
          params.options = {
            background_music: JSON.parse(
              finalData.workflowData.timeline[i].steps[j].value
            ).name,
            svd: {
              fps: 12,
              motionBucketId: 90,
              high_motionBucketId: 90,
            },
            minimax: {
              vol: 1,
              speed: 1,
            },
          };
        } else if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-49770322-3526-4245-a87a-a68148e93a6b"
        ) {
          params.voiceMap = {};
          // console.log(finalData.workflowData.timeline[i].steps[j].value)
          let temp = JSON.parse(
            finalData.workflowData.timeline[i].steps[j].value
          );
          for (let i = 0; i < temp.length; i++) {
            params.voiceMap[temp[i].characterName] = temp[i].id;
          }
        } else if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-1c8167f7-82bc-4d6a-a845-78fdf8047827"
        ) {
          let temp = JSON.parse(JSON.stringify(finalData));
          let obj = JSON.parse(temp.workflowData.timeline[i].steps[j].value);
          let a = [];
          if (Object.prototype.toString.call(obj) === "[object Array]") {
            a = obj[0].shots;
          } else if (
            Object.prototype.toString.call(obj) === "[object Object]"
          ) {
            a = obj.shots;
          }
          // console.log(a)
          let arr = [];
          for (let i = 0; i < a.length; i++) {
            if (a[i].sound_effect_description !== "") {
              arr.push(a[i]);
            }
          }
          params.soundEffects = arr;
        }
      }
    }
  }
  if (finalData.createType === "sd") {
    params.sdOption = finalData.sdOption;
    for (let q = 0; q < params.videoInput.shots.length; q++) {
      if (params.characterMap[params.videoInput.shots[q].image.actor]) {
        //检查params.videoInput.shots[q].image.image_prompt中有没有<lora
        // if (!params.videoInput.shots[q].image.image_prompt.includes('<lora')) {
        //   params.videoInput.shots[q].image.image_prompt += ',' + params.characterMap[params.videoInput.shots[q].image.actor].prompt
        // }
        // if (this.characterPromptInit) {
        let testArr = params.videoInput.shots[q];
        for (let key in params.characterMap) {
          // 2. 排除obj.image.actor和key不相等值。SETTING不参与匹配。
          // if (testArr.image.image_prompt.includes(key) && key !== testArr.image.actor && key !== 'SETTING') {
          if (testArr.image.image_prompt.includes(key) && key !== "SETTING") {
            // 3. 如果出现和b中相同的key值，则将匹配到的替换第一个值为actorName+'('+ b[actorName].prompt +')'。
            let flag = false;
            for (let t = 0; t < finalData.characterList.length; t++) {
              if (key === finalData.characterList[t].name) {
                // testArr.image.image_prompt = testArr.image.image_prompt.replace(key, key + '(' + finalData.characterList[t].triggerWord + ',' + finalData.characterList[t].lora + ')')
                testArr.image.image_prompt = testArr.image.image_prompt.replace(
                  key,
                  finalData.characterList[t].triggerWord +
                    "," +
                    finalData.characterList[t].lora
                );
                flag = true;
              }
            }
            if (!flag) {
              // testArr.image.image_prompt = testArr.image.image_prompt.replace(key, key + '(' + params.characterMap[key].prompt + ')')
              testArr.image.image_prompt = testArr.image.image_prompt.replace(
                key,
                params.characterMap[key].prompt
              );
            }
          }
        }
        // }
      }
      if (params.sdOption.styleLora && params.sdOption.styleLora !== "") {
        params.videoInput.shots[q].image.image_prompt +=
          "," + params.sdOption.styleLora;
      }
    }
  }
  params.enableSvd = finalData.enableSvd;
  params.PlotPrompt = finalData.PlotPrompt;
  params.flagName = finalData.name;
  console.log(params);
  return params;
}
module.exports = generateVideo;
