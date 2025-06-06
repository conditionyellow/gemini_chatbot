/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismFramework } from '../live2dcubismframework';
import { csmVector } from '../type/csmvector';
import { CubismJson } from '../utils/cubismjson';
const Epsilon = 0.001;
const DefaultFadeInSeconds = 0.5;
// Pose.jsonのタグ
const FadeIn = 'FadeInTime';
const Link = 'Link';
const Groups = 'Groups';
const Id = 'Id';
/**
 * パーツの不透明度の設定
 *
 * パーツの不透明度の管理と設定を行う。
 */
export class CubismPose {
    /**
     * インスタンスの作成
     * @param pose3json pose3.jsonのデータ
     * @param size pose3.jsonのデータのサイズ[byte]
     * @return 作成されたインスタンス
     */
    static create(pose3json, size) {
        const json = CubismJson.create(pose3json, size);
        if (!json) {
            return null;
        }
        const ret = new CubismPose();
        const root = json.getRoot();
        // フェード時間の指定
        if (!root.getValueByString(FadeIn).isNull()) {
            ret._fadeTimeSeconds = root
                .getValueByString(FadeIn)
                .toFloat(DefaultFadeInSeconds);
            if (ret._fadeTimeSeconds < 0.0) {
                ret._fadeTimeSeconds = DefaultFadeInSeconds;
            }
        }
        // パーツグループ
        const poseListInfo = root.getValueByString(Groups);
        const poseCount = poseListInfo.getSize();
        for (let poseIndex = 0; poseIndex < poseCount; ++poseIndex) {
            const idListInfo = poseListInfo.getValueByIndex(poseIndex);
            const idCount = idListInfo.getSize();
            let groupCount = 0;
            for (let groupIndex = 0; groupIndex < idCount; ++groupIndex) {
                const partInfo = idListInfo.getValueByIndex(groupIndex);
                const partData = new PartData();
                const parameterId = CubismFramework.getIdManager().getId(partInfo.getValueByString(Id).getRawString());
                partData.partId = parameterId;
                // リンクするパーツの設定
                if (!partInfo.getValueByString(Link).isNull()) {
                    const linkListInfo = partInfo.getValueByString(Link);
                    const linkCount = linkListInfo.getSize();
                    for (let linkIndex = 0; linkIndex < linkCount; ++linkIndex) {
                        const linkPart = new PartData();
                        const linkId = CubismFramework.getIdManager().getId(linkListInfo.getValueByIndex(linkIndex).getString());
                        linkPart.partId = linkId;
                        partData.link.pushBack(linkPart);
                    }
                }
                ret._partGroups.pushBack(partData.clone());
                ++groupCount;
            }
            ret._partGroupCounts.pushBack(groupCount);
        }
        CubismJson.delete(json);
        return ret;
    }
    /**
     * インスタンスを破棄する
     * @param pose 対象のCubismPose
     */
    static delete(pose) {
        if (pose != null) {
            pose = null;
        }
    }
    /**
     * モデルのパラメータの更新
     * @param model 対象のモデル
     * @param deltaTimeSeconds デルタ時間[秒]
     */
    updateParameters(model, deltaTimeSeconds) {
        // 前回のモデルと同じでない場合は初期化が必要
        if (model != this._lastModel) {
            // パラメータインデックスの初期化
            this.reset(model);
        }
        this._lastModel = model;
        // 設定から時間を変更すると、経過時間がマイナスになる事があるので、経過時間0として対応
        if (deltaTimeSeconds < 0.0) {
            deltaTimeSeconds = 0.0;
        }
        let beginIndex = 0;
        for (let i = 0; i < this._partGroupCounts.getSize(); i++) {
            const partGroupCount = this._partGroupCounts.at(i);
            this.doFade(model, deltaTimeSeconds, beginIndex, partGroupCount);
            beginIndex += partGroupCount;
        }
        this.copyPartOpacities(model);
    }
    /**
     * 表示を初期化
     * @param model 対象のモデル
     * @note 不透明度の初期値が0でないパラメータは、不透明度を１に設定する
     */
    reset(model) {
        let beginIndex = 0;
        for (let i = 0; i < this._partGroupCounts.getSize(); ++i) {
            const groupCount = this._partGroupCounts.at(i);
            for (let j = beginIndex; j < beginIndex + groupCount; ++j) {
                this._partGroups.at(j).initialize(model);
                const partsIndex = this._partGroups.at(j).partIndex;
                const paramIndex = this._partGroups.at(j).parameterIndex;
                if (partsIndex < 0) {
                    continue;
                }
                model.setPartOpacityByIndex(partsIndex, j == beginIndex ? 1.0 : 0.0);
                model.setParameterValueByIndex(paramIndex, j == beginIndex ? 1.0 : 0.0);
                for (let k = 0; k < this._partGroups.at(j).link.getSize(); ++k) {
                    this._partGroups.at(j).link.at(k).initialize(model);
                }
            }
            beginIndex += groupCount;
        }
    }
    /**
     * パーツの不透明度をコピー
     *
     * @param model 対象のモデル
     */
    copyPartOpacities(model) {
        for (let groupIndex = 0; groupIndex < this._partGroups.getSize(); ++groupIndex) {
            const partData = this._partGroups.at(groupIndex);
            if (partData.link.getSize() == 0) {
                continue; // 連動するパラメータはない
            }
            const partIndex = this._partGroups.at(groupIndex).partIndex;
            const opacity = model.getPartOpacityByIndex(partIndex);
            for (let linkIndex = 0; linkIndex < partData.link.getSize(); ++linkIndex) {
                const linkPart = partData.link.at(linkIndex);
                const linkPartIndex = linkPart.partIndex;
                if (linkPartIndex < 0) {
                    continue;
                }
                model.setPartOpacityByIndex(linkPartIndex, opacity);
            }
        }
    }
    /**
     * パーツのフェード操作を行う。
     * @param model 対象のモデル
     * @param deltaTimeSeconds デルタ時間[秒]
     * @param beginIndex フェード操作を行うパーツグループの先頭インデックス
     * @param partGroupCount フェード操作を行うパーツグループの個数
     */
    doFade(model, deltaTimeSeconds, beginIndex, partGroupCount) {
        let visiblePartIndex = -1;
        let newOpacity = 1.0;
        const phi = 0.5;
        const backOpacityThreshold = 0.15;
        // 現在、表示状態になっているパーツを取得
        for (let i = beginIndex; i < beginIndex + partGroupCount; ++i) {
            const partIndex = this._partGroups.at(i).partIndex;
            const paramIndex = this._partGroups.at(i).parameterIndex;
            if (model.getParameterValueByIndex(paramIndex) > Epsilon) {
                if (visiblePartIndex >= 0) {
                    break;
                }
                visiblePartIndex = i;
                // ゼロ除算の回避
                if (this._fadeTimeSeconds == 0) {
                    newOpacity = 1.0;
                    continue;
                }
                newOpacity = model.getPartOpacityByIndex(partIndex);
                // 新しい不透明度を計算
                newOpacity += deltaTimeSeconds / this._fadeTimeSeconds;
                if (newOpacity > 1.0) {
                    newOpacity = 1.0;
                }
            }
        }
        if (visiblePartIndex < 0) {
            visiblePartIndex = 0;
            newOpacity = 1.0;
        }
        // 表示パーツ、非表示パーツの不透明度を設定する
        for (let i = beginIndex; i < beginIndex + partGroupCount; ++i) {
            const partsIndex = this._partGroups.at(i).partIndex;
            // 表示パーツの設定
            if (visiblePartIndex == i) {
                model.setPartOpacityByIndex(partsIndex, newOpacity); // 先に設定
            }
            // 非表示パーツの設定
            else {
                let opacity = model.getPartOpacityByIndex(partsIndex);
                let a1; // 計算によって求められる不透明度
                if (newOpacity < phi) {
                    a1 = (newOpacity * (phi - 1)) / phi + 1.0; // (0,1),(phi,phi)を通る直線式
                }
                else {
                    a1 = ((1 - newOpacity) * phi) / (1.0 - phi); // (1,0),(phi,phi)を通る直線式
                }
                // 背景の見える割合を制限する場合
                const backOpacity = (1.0 - a1) * (1.0 - newOpacity);
                if (backOpacity > backOpacityThreshold) {
                    a1 = 1.0 - backOpacityThreshold / (1.0 - newOpacity);
                }
                if (opacity > a1) {
                    opacity = a1; // 計算の不透明度よりも大きければ（濃ければ）不透明度を上げる
                }
                model.setPartOpacityByIndex(partsIndex, opacity);
            }
        }
    }
    /**
     * コンストラクタ
     */
    constructor() {
        this._fadeTimeSeconds = DefaultFadeInSeconds;
        this._lastModel = null;
        this._partGroups = new csmVector();
        this._partGroupCounts = new csmVector();
    }
}
/**
 * パーツにまつわるデータを管理
 */
export class PartData {
    /**
     * コンストラクタ
     */
    constructor(v) {
        this.parameterIndex = 0;
        this.partIndex = 0;
        this.link = new csmVector();
        if (v != undefined) {
            this.partId = v.partId;
            for (const ite = v.link.begin(); ite.notEqual(v.link.end()); ite.preIncrement()) {
                this.link.pushBack(ite.ptr().clone());
            }
        }
    }
    /**
     * =演算子のオーバーロード
     */
    assignment(v) {
        this.partId = v.partId;
        for (const ite = v.link.begin(); ite.notEqual(v.link.end()); ite.preIncrement()) {
            this.link.pushBack(ite.ptr().clone());
        }
        return this;
    }
    /**
     * 初期化
     * @param model 初期化に使用するモデル
     */
    initialize(model) {
        this.parameterIndex = model.getParameterIndex(this.partId);
        this.partIndex = model.getPartIndex(this.partId);
        model.setParameterValueByIndex(this.parameterIndex, 1);
    }
    /**
     * オブジェクトのコピーを生成する
     */
    clone() {
        const clonePartData = new PartData();
        clonePartData.partId = this.partId;
        clonePartData.parameterIndex = this.parameterIndex;
        clonePartData.partIndex = this.partIndex;
        clonePartData.link = new csmVector();
        for (let ite = this.link.begin(); ite.notEqual(this.link.end()); ite.increment()) {
            clonePartData.link.pushBack(ite.ptr().clone());
        }
        return clonePartData;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismpose';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismPose = $.CubismPose;
    Live2DCubismFramework.PartData = $.PartData;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismpose.js.map