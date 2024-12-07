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
    const compressionRatio = document.getElementById('compressionRatio');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');
    const errorMessage = document.getElementById('errorMessage');
    const loadingOverlay = document.getElementById('loadingOverlay');

    let originalFile = null;
    let lastCompressedBlob = null;

    // 显示错误信息
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }

    // 显示加载状态
    function showLoading(show) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    // 验证文件
    function validateFile(file) {
        if (!file) {
            showError('请选择一个文件');
            return false;
        }

        if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
            showError('请上传PNG或JPG格式的图片');
            return false;
        }

        if (file.size > 10 * 1024 * 1024) {
            showError('图片大小不能超过10MB');
            return false;
        }

        return true;
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 计算压缩比率
    function calculateCompressionRatio(originalSize, compressedSize) {
        const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        return `压缩率：${ratio}%`;
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
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (validateFile(file)) {
            handleImageUpload(file);
        }
        // 清除input的值，允许重复选择同一文件
        fileInput.value = '';
    });

    // 处理图片上传
    async function handleImageUpload(file) {
        try {
            showLoading(true);
            originalFile = file;

            // 显示原始图片预览
            const originalUrl = URL.createObjectURL(file);
            originalPreview.src = originalUrl;
            originalSize.textContent = formatFileSize(file.size);

            // 压缩图片
            await compressImage(file, qualitySlider.value / 100);

            // 显示预览区域
            previewSection.style.display = 'block';

            // 滚动到预览区域
            previewSection.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            showError('处理图片时出错：' + error.message);
        } finally {
            showLoading(false);
        }
    }

    // 压缩图片
    async function compressImage(file, quality) {
        try {
            // 根据文件大小动态调整压缩参数
            const maxSizeMB = file.size > 5 * 1024 * 1024 ? 2 : 1;
            
            const options = {
                maxSizeMB: maxSizeMB,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                initialQuality: quality
            };

            const compressedFile = await imageCompression(file, options);
            lastCompressedBlob = compressedFile;

            const compressedUrl = URL.createObjectURL(compressedFile);
            compressedPreview.src = compressedUrl;
            compressedSize.textContent = formatFileSize(compressedFile.size);
            
            // 显示压缩比率
            compressionRatio.textContent = calculateCompressionRatio(file.size, compressedFile.size);

            // 更新下载按钮
            downloadBtn.onclick = () => {
                if (lastCompressedBlob) {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(lastCompressedBlob);
                    // 保持原始文件扩展名
                    const extension = file.name.split('.').pop();
                    link.download = `compressed_${file.name.replace(/\.[^/.]+$/, '')}.${extension}`;
                    link.click();
                }
            };

            // 释放之前的URL
            URL.revokeObjectURL(compressedUrl);
        } catch (error) {
            throw new Error('压缩失败：' + error.message);
        }
    }

    // 质量滑块变化时重新压缩
    let debounceTimer;
    qualitySlider.addEventListener('input', (e) => {
        const quality = e.target.value;
        qualityValue.textContent = `${quality}%`;
        
        // 使用防抖来避免频繁压缩
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (originalFile) {
                compressImage(originalFile, quality / 100);
            }
        }, 200);
    });

    // 清理函数
    function cleanup() {
        if (originalFile) {
            URL.revokeObjectURL(originalPreview.src);
            URL.revokeObjectURL(compressedPreview.src);
        }
    }

    // 页面卸载时清理
    window.addEventListener('beforeunload', cleanup);
});