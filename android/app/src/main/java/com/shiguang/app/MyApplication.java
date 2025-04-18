package com.shiguang.app;

import android.app.Application;
// 尝试com.hj.ads包名
import com.hzhj.openads.HJAdsSdk;

public class MyApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        
        // 初始化灰鲸广告SDK
        HJAdsSdk ads = HJAdsSdk.sharedAds();
        
        // 是否成年（可选参数，默认是成年用户）
        ads.setAdult(true);
        
        // 是否开启个性化推荐接口（可选参数，建议开启）
        ads.setPersonalizedAdvertisingOn(true);
        
        // true开启、false关闭Debug模式（默认关闭）
        ads.setDebugEnable(false);
        
        // 使用appId启动SDK
        ads.startWithAppId(this, "56944"); // 更新为图片中的AppID
    }
} 