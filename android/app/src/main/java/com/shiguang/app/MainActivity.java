package com.shiguang.app;

import android.os.Bundle;
import android.view.WindowManager;
import android.view.View;
import android.os.Build;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 注册自定义插件
        registerPlugin(RewardAdPlugin.class);
        
        super.onCreate(savedInstanceState);
        
        // 设置状态栏为透明
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);
        }
        
        // 设置内容延伸到状态栏
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            View decorView = getWindow().getDecorView();
            int option = View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
            decorView.setSystemUiVisibility(option);
        }
    }
}
