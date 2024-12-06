// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const previewSection = document.getElementById('previewSection');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');
    const errorMessage = document.getElementById('errorMessage');
    const loadingIndicator = document.getElementById('loadingIndicator');

    let originalFile = null;

    // 显示错误信息
    function showError(message) {
        console.log('显示错误:', message); // 调试日志
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }

    // 验证文件
    function validateFile(file) {
        // 检查文件是否存在
        if (!file) {
            showError('请选择一个文件');
            return false;
        }

        // 检查文件类型
        if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
            showError('请上传PNG或JPG格式的图片');
            return false;
        }

        // 检查文件大小（最大10MB）
        if (file.size > 10 * 1024 * 1024) {
            showError('图片大小不能超过10MB');
            return false;
        }

        return true;
    }

    // 处理拖放
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.borderColor = '#0071e3';
        dropZone.style.backgroundColor = '#f5f5f7';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.borderColor = '#d2d2d7';
        dropZone.style.backgroundColor = 'white';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.borderColor = '#d2d2d7';
        dropZone.style.backgroundColor = 'white';
        
        const file = e.dataTransfer.files[0];
        if (validateFile(file)) {
            handleImageUpload(file);
        }
    });

    // 点击上传
    dropZone.addEventListener('click', () => {
        console.log('点击上传区域'); // 调试日志
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        console.log('文件选择变化'); // 调试日志
        const file = e.target.files[0];
        if (validateFile(file)) {
            handleImageUpload(file);
        }
    });

    // 处理图片上传
    async function handleImageUpload(file) {
        try {
            console.log('开始处理图片:', file.name); // 调试日志
            originalFile = file;
            loadingIndicator.style.display = 'flex';
            downloadBtn.disabled = true;
            
            // 显示原始图片预览
            const originalUrl = URL.createObjectURL(file);
            originalPreview.src = originalUrl;
            originalSize.textContent = formatFileSize(file.size);
            
            // 压缩图片
            await compressImage(file, qualitySlider.value / 100);
            
            // 显示预览区域
            previewSection.style.display = 'block';
        } catch (error) {
            showError('处理图片时出错：' + error.message);
            console.error('图片处理错误:', error);
        } finally {
            loadingIndicator.style.display = 'none';
            downloadBtn.disabled = false;
        }
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 压缩图片
    async function compressImage(file, quality) {
        try {
            console.log('开始压缩图片，质量:', quality); // 调试日志
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                quality: quality,
                onProgress: (progress) => {
                    console.log('压缩进度:', progress);
                }
            };

            const compressedFile = await imageCompression(file, options);
            const compressedUrl = URL.createObjectURL(compressedFile);
            compressedPreview.src = compressedUrl;
            compressedSize.textContent = formatFileSize(compressedFile.size);
            
            // 更新下载按钮
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = compressedUrl;
                link.download = `compressed_${file.name}`;
                link.click();
            };
        } catch (error) {
            throw new Error('压缩失败：' + error.message);
        }
    }

    // 质量滑块变化时重新压缩
    let debounceTimer;
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = `${e.target.value}%`;
        
        // 使用防抖来避免频繁压缩
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (originalFile) {
                handleImageUpload(originalFile);
            }
        }, 300);
    });

    console.log('初始化完成'); // 调试日志
}); 