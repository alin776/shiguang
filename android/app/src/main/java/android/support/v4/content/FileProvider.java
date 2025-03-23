package android.support.v4.content;

/**
 * 兼容性FileProvider类
 * 
 * 这个类继承自androidx.core.content.FileProvider，用于处理旧版广告SDK依赖旧的support库的问题
 * 部分第三方SDK仍然使用老版本的support库，而项目已经迁移到androidx
 */
public class FileProvider extends androidx.core.content.FileProvider {
    // 继承所有方法，无需额外实现
} 