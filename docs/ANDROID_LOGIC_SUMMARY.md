# AI漫剧项目 - Android 完整逻辑总结

## 项目概述

**应用名称**: AI漫导 (Director AI)
**包名**: com.directorai.director_ai
**版本**: 1.0.0+1
**架构**: Flutter + Android Native

## 一、Android 原生层架构

### 1.1 MainActivity.kt 核心逻辑

**文件路径**: `android/app/src/main/kotlin/com/directorai/director_ai/MainActivity.kt`

#### 主要功能模块

```
MainActivity (FlutterActivity)
├── MethodChannel 通信通道
│   ├── mergeVideosLossless - 无损视频合并
│   ├── saveVideoToGallery - 保存视频到相册
│   └── saveImageToGallery - 保存图片到相册
├── 视频合并引擎
│   ├── mergeVideosLossless() - 入口方法
│   ├── mergeWithMediaMuxer() - MediaMuxer 实现
│   └── copyTrack() - 轨道数据复制
└── 相册保存
    ├── saveVideoToGallery() - 视频保存
    └── saveImageToGallery() - 图片保存
```

### 1.2 MethodChannel 通信机制

**通道名称**: `com.directorai.director_ai/video_merge`

#### 方法列表

| 方法名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| `mergeVideosLossless` | `inputPaths: List<String>`, `outputPath: String` | `String` (合并后的文件路径) | 无损合并多个视频 |
| `saveVideoToGallery` | `filePath: String` | `String` (保存后的URI) | 保存视频到系统相册 |
| `saveImageToGallery` | `filePath: String` | `String` (保存后的URI) | 保存图片到系统相册 |

## 二、视频合并核心逻辑

### 2.1 无损视频合并方案

**技术选型**: Android MediaMuxer API (Android 原生方案，无需第三方依赖)

#### 合并流程

```
1. 输入验证
   ├── 验证输入文件存在性
   └── 检查文件路径有效性

2. 获取视频格式信息
   ├── 使用第一个视频作为格式参考
   ├── 提取视频轨道 (video/)
   └── 提取音频轨道 (audio/)

3. 创建 MediaMuxer
   ├── 输出格式: MUXER_OUTPUT_MPEG_4 (.mp4)
   ├── 添加视频轨道
   └── 添加音频轨道

4. 逐个处理视频文件
   ├── 初始化 MediaExtractor
   ├── 定位视频/音频轨道索引
   ├── 计算时间戳偏移量
   ├── 复制视频样本数据
   └── 复制音频样本数据

5. 清理资源
   ├── 停止 MediaMuxer
   ├── 释放 MediaExtractor
   └── 更新日志
```

### 2.2 关键技术细节

#### 时间戳偏移处理

```kotlin
// 核心算法：确保视频连续播放
val actualOffset = timeOffset - firstSampleTime
info.presentationTimeUs = originalTime + actualOffset
```

- `firstSampleTime`: 当前视频第一个样本的时间戳
- `timeOffset`: 累积的时间偏移量（前一个视频的结束时间）
- `actualOffset`: 实际应用的偏移量
- 确保所有视频无缝衔接

#### 轨道复制逻辑

```kotlin
copyTrack(
    extractor: MediaExtractor,
    muxer: MediaMuxer,
    trackIndex: Int,
    buffer: ByteBuffer,
    info: BufferInfo,
    timeOffset: Long,
    firstSampleTime: Long,
    isVideo: Boolean
): Pair<Int, Long>
```

**返回值**:
- `Int`: 写入的样本数量
- `Long`: 结束时间戳（用于下一个视频的时间偏移）

## 三、相册保存逻辑

### 3.1 视频保存

```kotlin
saveVideoToGallery(filePath: String): String
```

**实现步骤**:
1. 验证源文件存在
2. 创建 ContentValues
   - `DISPLAY_NAME`: Video_{timestamp}.mp4
   - `MIME_TYPE`: video/mp4
   - `RELATIVE_PATH`: Movies/Movies
   - `IS_PENDING`: 1 (写入中)
3. 插入 MediaStore 记录
4. 写入文件数据流
5. 更新 IS_PENDING 为 0 (完成)
6. 返回内容 URI

### 3.2 图片保存

```kotlin
saveImageToGallery(filePath: String): String
```

**实现步骤**:
1. 验证源文件存在
2. 创建 ContentValues
   - `DISPLAY_NAME`: Image_{timestamp}.jpg
   - `MIME_TYPE`: image/jpeg
   - `RELATIVE_PATH`: Pictures/Movies
   - `IS_PENDING`: 1 (写入中)
3. 插入 MediaStore 记录
4. 写入文件数据流
5. 更新 IS_PENDING 为 0 (完成)
6. 返回内容 URI

## 四、Flutter 层服务架构

### 4.1 VideoMergerService (视频合并服务)

**文件路径**: `lib/services/video_merger_service.dart`

#### 核心方法

```dart
class VideoMergerService {
  // 合并场景视频
  Future<File> mergeSceneVideos(
    Screenplay screenplay,
    {VideoMergeProgressCallback? onProgress}
  )

  // Mp4Parser 无损合并
  Future<File> _mergeWithMp4Parser(...)

  // Mock 模式合并（测试用）
  Future<File> _mergeWithMock(...)

  // 管理功能
  Future<List<File>> getMergedVideos()
  Future<void> clearMergedVideos()
  Future<int> getMergedVideosSize()
  Future<int> getMergedVideosCount()
}
```

#### 合并流程 (Mp4Parser 模式)

```
1. 下载所有场景视频到临时目录
   ├── 逐个下载视频文件
   ├── 显示下载进度 (0.1 - 0.6)
   └── 保存到临时文件夹

2. 调用原生方法合并
   ├── 准备输入路径列表
   ├── 生成输出文件路径
   ├── invokeMethod('mergeVideosLossless')
   └── 等待合并完成 (0.6 - 0.95)

3. 清理临时文件
   ├── 删除临时目录
   └── 返回合并后的视频文件

4. 返回结果
   └── File (合并后的视频文件)
```

### 4.2 GalleryService (相册服务)

**文件路径**: `lib/services/gallery_service.dart`

#### 核心方法

```dart
class GalleryService {
  // 保存本地视频到相册
  Future<String> saveVideoToGallery(String filePath)

  // 保存本地图片到相册
  Future<String> saveImageToGallery(String filePath)

  // 下载网络图片并保存
  Future<String> downloadAndSaveImage(
    String imageUrl,
    {void Function(double, String)? onProgress}
  )

  // 下载网络视频并保存
  Future<String> downloadAndSaveVideo(
    String videoUrl,
    {void Function(double, String)? onProgress}
  )
}
```

#### 下载保存流程

```
1. 下载网络资源到临时目录
   ├── 获取临时目录路径
   ├── 生成临时文件名
   └── 使用 Dio 下载 (0.2 - 0.8)

2. 保存到系统相册
   ├── 调用原生方法
   └── 保存到 MediaStore (0.8 - 1.0)

3. 清理临时文件
   └── 删除临时文件
```

### 4.3 VideoMergeProvider (状态管理)

**文件路径**: `lib/providers/video_merge_provider.dart`

#### 状态定义

```dart
enum MergeStatus {
  idle,       // 空闲
  preparing,  // 准备中 (0.0 - 0.1)
  downloading,// 下载中 (0.1 - 0.6)
  merging,    // 合并中 (0.6 - 0.95)
  completed,  // 完成
  error       // 错误
}
```

#### 状态属性

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `status` | MergeStatus | 当前合并状态 |
| `progress` | double | 合并进度 (0.0 - 1.0) |
| `statusMessage` | String | 状态描述信息 |
| `errorMessage` | String? | 错误信息 |
| `mergedVideoFile` | File? | 合并后的视频文件 |
| `scenes` | List<SceneVideoInfo> | 场景视频列表 (Mock 模式) |
| `mergedVideosCount` | int | 已合并视频数量 |
| `mergedVideosSize` | int | 合并视频总大小 |

## 五、Android 配置文件

### 5.1 AndroidManifest.xml

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- 权限 -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>

    <application
        android:label="AI漫导"
        android:name="${applicationName}"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
        <meta-data
            android:name="flutterEmbedding"
            android:value="2" />
    </application>
</manifest>
```

### 5.2 build.gradle (app)

```gradle
plugins {
    id "com.android.application"
    id "kotlin-android"
    id "dev.flutter.flutter-gradle-plugin"
}

android {
    namespace "com.directorai.director_ai"
    compileSdk 36
    ndkVersion flutter.ndkVersion

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = '17'
    }

    defaultConfig {
        applicationId "com.directorai.director_ai"
        minSdkVersion flutter.minSdkVersion
        targetSdk 36
        versionCode 1
        versionName "1.0"
    }
}

dependencies {
    // 使用 Android 原生 MediaMuxer API，无需额外依赖
}
```

### 5.3 build.gradle (project)

```gradle
buildscript {
    ext.kotlin_version = '2.1.0'
    repositories {
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/public' }
        maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
        google()
        mavenCentral()
    }

    dependencies {
        classpath 'com.android.tools.build:gradle:8.9.1'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}
```

## 六、Flutter 依赖

### pubspec.yaml

```yaml
dependencies:
  flutter:
    sdk: flutter
  dio: ^5.4.0                    # HTTP 下载
  path_provider: ^2.1.5          # 文件路径
  video_player: ^2.8.2           # 视频播放
  chewie: ^1.7.4                 # 视频播放器 UI
  image_picker: ^1.0.4           # 图片选择
  shared_preferences: ^2.2.2     # 本地存储
  cached_network_image: ^3.3.1   # 网络图片缓存
  hive: ^2.2.3                   # 本地数据库
  url_launcher: ^6.3.0           # URL 跳转
```

## 七、数据流程图

### 7.1 视频合并完整流程

```
用户点击"合并视频"
    ↓
VideoMergeProvider.mergeVideos(screenplay)
    ↓
VideoMergerService.mergeSceneVideos()
    ↓
下载所有场景视频 (Dio)
    ↓
调用 Android 原生方法
    MethodChannel.invokeMethod('mergeVideosLossless')
    ↓
MainActivity.mergeVideosLossless()
    ↓
mergeWithMediaMuxer()
    ├── 创建 MediaMuxer
    ├── 提取第一个视频格式
    ├── 添加视频/音频轨道
    ├── 逐个处理视频
    │   ├── 初始化 MediaExtractor
    │   ├── 定位轨道
    │   ├── 计算偏移量
    │   └── copyTrack()
    └── 停止 MediaMuxer
    ↓
返回合并后的文件路径
    ↓
Flutter 接收结果
    ↓
更新 VideoMergeProvider 状态
    ↓
用户可播放或保存视频
```

### 7.2 保存到相册流程

```
用户点击"保存到相册"
    ↓
调用 GalleryService.saveVideoToGallery()
    ↓
MethodChannel.invokeMethod('saveVideoToGallery')
    ↓
MainActivity.saveVideoToGallery()
    ├── 验证文件存在
    ├── 创建 ContentValues
    ├── 插入 MediaStore
    ├── 写入文件流
    └── 更新 IS_PENDING
    ↓
返回内容 URI
    ↓
显示"保存成功"提示
```

## 八、错误处理

### 8.1 Android 层错误

```kotlin
try {
    val mergedPath = mergeVideosLossless(inputPaths, outputPath)
    result.success(mergedPath)
} catch (e: Exception) {
    Log.e(TAG, "Video merge failed", e)
    result.error("MERGE_FAILED", e.message, null)
}
```

**错误类型**:
- `INVALID_ARGUMENTS`: 参数缺失或无效
- `MERGE_FAILED`: 视频合并失败
- `SAVE_FAILED`: 保存到相册失败

### 8.2 Flutter 层错误

```dart
try {
    final resultFile = await _merger.mergeSceneVideos(...);
    // 处理成功
} catch (e) {
    _status = MergeStatus.error;
    _errorMessage = e.toString();
    _statusMessage = '合并失败';
    notifyListeners();
}
```

## 九、性能优化

### 9.1 视频合并优化

- **异步处理**: 使用协程 (GlobalScope.launch) 在 IO 线程执行
- **内存管理**: 复用 ByteBuffer (1MB 缓冲区)
- **进度反馈**: 实时返回进度给 Flutter 层

### 9.2 下载优化

- **分片下载**: Dio 支持下载进度回调
- **临时文件**: 下载到临时目录，完成后清理
- **并发限制**: 串行下载，避免网络压力

## 十、权限管理

### 10.1 存储权限

```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

**注意**: Android 10+ 使用 Scoped Storage，通过 MediaStore 访问文件

## 十一、日志系统

### 11.1 日志标签

- `VideoMerge`: 视频合并相关日志
- `GeneratedPluginRegistrant`: 插件注册日志

### 11.2 日志级别

```kotlin
Log.d(TAG, "调试信息")
Log.e(TAG, "错误信息", exception)
```

## 十二、关键代码片段

### 12.1 时间戳偏移计算

```kotlin
// MainActivity.kt:287
val actualOffset = timeOffset - firstSampleTime
info.presentationTimeUs = originalTime + actualOffset
```

### 12.2 MethodChannel 调用

```dart
// Flutter 层
final result = await _channel.invokeMethod('mergeVideosLossless', {
    'inputPaths': inputPaths,
    'outputPath': outputPath,
});
```

```kotlin
// Android 层
MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
    .setMethodCallHandler { call, result ->
        when (call.method) {
            "mergeVideosLossless" -> {
                // 处理逻辑
            }
        }
    }
```

## 十三、测试与调试

### 13.1 Mock 模式

```dart
static const bool useMockMode = false;
```

当启用 Mock 模式时：
- 不调用原生合并方法
- 仅下载所有场景视频
- 生成索引 JSON 文件

### 13.2 调试技巧

1. **查看日志**: `adb logcat -s VideoMerge`
2. **监控进度**: 观察进度回调输出
3. **验证文件**: 检查输出目录文件

## 十四、未来扩展

### 14.1 可能的增强功能

- 支持更多视频格式 (MKV, AVI)
- 添加视频转码功能
- 支持音频混合
- 添加视频滤镜
- 支持字幕添加

### 14.2 性能优化方向

- 使用 FFmpeg 替代 MediaMuxer (更强大但需要依赖)
- 多线程下载
- 视频预加载
- 增量合并

## 十五、总结

本项目 Android 层实现了完整的视频处理功能，核心特点：

1. **无损合并**: 使用 MediaMuxer 实现 MP4 无损合并
2. **相册集成**: 通过 MediaStore API 保存到系统相册
3. **Flutter 通信**: 使用 MethodChannel 实现跨平台调用
4. **状态管理**: Provider 模式管理合并状态
5. **进度反馈**: 实时显示下载和合并进度
6. **错误处理**: 完善的异常捕获和错误提示

**技术栈**:
- Android: Kotlin + MediaMuxer
- Flutter: Dart + MethodChannel
- HTTP: Dio
- 存储: Hive

**优势**:
- 原生性能
- 无第三方视频处理依赖
- 代码简洁易维护
- 支持异步并发处理
