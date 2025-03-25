package com.shiguang.app;

import android.app.Activity;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.hzhj.openads.HJAdsSdkReward;
import com.hzhj.openads.req.HJRewardAdRequest;
import com.hzhj.openads.listener.HJOnAdsSdkRewardListener;
import com.hzhj.openads.domain.HJAdError;
import com.hzhj.openads.HJRewardVerify;

import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(name = "RewardAd")
public class RewardAdPlugin extends Plugin {
    private static final String TAG = "RewardAdPlugin";
    private HJAdsSdkReward mRewardAd; // 全局对象

    @PluginMethod
    public void showRewardAd(PluginCall call) {
        try {
            String placementId = call.getString("placementId", "7996454374369345"); // 默认使用图片中的广告ID
            String userId = call.getString("userId", "");
            
            Activity activity = getActivity();
            if (activity != null) {
                loadAd(placementId, userId, call);
            } else {
                call.reject("Activity is null");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error showing reward ad", e);
            call.reject("Failed to show reward ad: " + e.getMessage());
        }
    }

    /**
     * 加载广告
     */
    private void loadAd(String placementId, String userId, PluginCall call) {
        Map<String, Object> options = new HashMap<>();
        
        if (mRewardAd == null) {
            mRewardAd = new HJAdsSdkReward(getActivity(), new HJRewardAdRequest(placementId, userId, options), new HJOnAdsSdkRewardListener() {
                @Override
                public void onVideoAdLoadSuccess(String placementId) {
                    Log.d(TAG, "广告加载成功: " + placementId);
                    // 加载成功后自动展示广告
                    if (mRewardAd != null && mRewardAd.isReady()) {
                        // 根据文档正确的方法是show而不是showAd
                        HashMap<String, String> showOptions = new HashMap<>();
                        mRewardAd.show(showOptions);
                    }
                    
                    // 通知前端
                    notifyListeners("onRewardAdLoadSuccess", new JSObject().put("placementId", placementId));
                }

                @Override
                public void onVideoAdPlayEnd() {
                    Log.d(TAG, "视频播放结束");
                    notifyListeners("onRewardAdPlayEnd", new JSObject());
                }

                @Override
                public void onVideoAdPlayStart() {
                    Log.d(TAG, "视频播放开始");
                    notifyListeners("onRewardAdShowSuccess", new JSObject().put("placementId", placementId));
                }

                @Override
                public void onVideoAdClicked() {
                    Log.d(TAG, "视频被点击");
                    notifyListeners("onRewardAdClicked", new JSObject().put("placementId", placementId));
                }

                @Override
                public void onVideoRewarded(String transId, HJRewardVerify hjRewardVerify) {
                    Log.d(TAG, "获得奖励: " + transId);
                    JSObject reward = new JSObject();
                    reward.put("transId", transId);
                    
                    if (hjRewardVerify != null) {
                        // 根据文档正确的属性是isReward而不是isSuccess
                        reward.put("isReward", hjRewardVerify.isReward());
                        reward.put("errorCode", hjRewardVerify.getErrorCode());
                        reward.put("errorMsg", hjRewardVerify.getErrorMsg());
                    }
                    
                    notifyListeners("onRewardAdRewarded", reward);
                    
                    // 成功回调给前端
                    call.resolve(reward);
                }

                @Override
                public void onVideoAdClosed() {
                    Log.d(TAG, "广告关闭");
                    notifyListeners("onRewardAdClosed", new JSObject().put("placementId", placementId));
                    
                    // 释放广告对象
                    mRewardAd = null;
                }

                @Override
                public void onVideoAdLoadError(HJAdError error, final String placementId) {
                    Log.e(TAG, "广告加载错误: " + error);
                    JSObject errorObj = new JSObject();
                    errorObj.put("placementId", placementId);
                    errorObj.put("error", error.toString());
                    
                    notifyListeners("onRewardAdLoadFailed", errorObj);
                    
                    // 错误回调给前端
                    call.reject("Ad load error", errorObj);
                    
                    // 释放广告对象
                    mRewardAd = null;
                }

                @Override
                public void onVideoAdPlayError(HJAdError error, final String placementId) {
                    Log.e(TAG, "广告播放错误: " + error);
                    JSObject errorObj = new JSObject();
                    errorObj.put("placementId", placementId);
                    errorObj.put("error", error.toString());
                    
                    notifyListeners("onRewardAdShowFailed", errorObj);
                    
                    // 错误回调给前端
                    call.reject("Ad play error", errorObj);
                    
                    // 释放广告对象
                    mRewardAd = null;
                }
            });
        }

        // 加载广告
        mRewardAd.loadAd();
    }

    @Override
    protected void handleOnDestroy() {
        mRewardAd = null;
        super.handleOnDestroy();
    }
} 