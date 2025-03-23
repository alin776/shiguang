package com.hj.ads;

import android.content.Context;

/**
 * 灰鲸广告SDK模拟类
 * 这是一个模拟实现，用于解决编译依赖问题
 */
public class HJAdsSdk {
    private static HJAdsSdk instance;
    private boolean isAdult = true;
    private boolean isPersonalizedAdvertisingOn = true;
    private boolean isDebugEnable = false;
    private String appId;
    private Context appContext;

    // 私有构造函数，实现单例模式
    private HJAdsSdk() {
    }

    // 获取共享实例
    public static HJAdsSdk sharedAds() {
        if (instance == null) {
            instance = new HJAdsSdk();
        }
        return instance;
    }

    // 设置是否成年用户
    public void setAdult(boolean isAdult) {
        this.isAdult = isAdult;
    }

    // 设置是否开启个性化推荐
    public void setPersonalizedAdvertisingOn(boolean isPersonalizedAdvertisingOn) {
        this.isPersonalizedAdvertisingOn = isPersonalizedAdvertisingOn;
    }

    // 设置是否开启调试模式
    public void setDebugEnable(boolean isDebugEnable) {
        this.isDebugEnable = isDebugEnable;
    }

    // 使用appId启动SDK
    public void startWithAppId(Context context, String appId) {
        this.appId = appId;
        this.appContext = context.getApplicationContext();
        
        // 模拟SDK初始化
        System.out.println("HJAdsSdk初始化成功，AppID: " + appId);
    }
} 