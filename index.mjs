import fs from 'fs';
import readline from 'readline';
import { resolve, dirname, basename, extname } from 'path';
import sharp from 'sharp';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

// 将单个文件转换为 WebP 格式
async function convertFile(inputPath, quality, removeSource) {
	const outputName = `${basename(inputPath, extname(inputPath))}.webp`;
	const outputPath = resolve(dirname(inputPath), outputName);

	const startTime = Date.now(); // 记录开始时间

	try {
		await sharp(inputPath).toFormat('webp', { quality }).toFile(outputPath);
		console.log(`已成功将 ${inputPath} 转换为 WebP 格式，并保存至 ${outputPath}`);

		const endTime = Date.now(); // 记录结束时间
		const duration = (endTime - startTime) / 1000; // 毫秒转换为秒
		console.log(`转换耗时：${duration.toFixed(2)} 秒`);

		if (removeSource) {
			await fs.promises.unlink(inputPath);
			console.log(`已删除源文件 ${inputPath}`);
		}
	} catch (err) {
		console.error(`转换 ${inputPath} 失败：`, err);
	}
}

// 将文件夹中的所有文件转换为 WebP 格式
async function convertFolder(sourcePath, targetFolder, quality, removeSource) {
	if (!fs.existsSync(targetFolder)) {
		fs.mkdirSync(targetFolder, { recursive: true });
	}

	const startTime = Date.now(); // 记录开始时间

	try {
		const files = await fs.promises.readdir(sourcePath);
		const imageFiles = files.filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));

		for (const file of imageFiles) {
			const inputPath = resolve(sourcePath, file);
			await convertFile(inputPath, quality, removeSource);
		}

		const endTime = Date.now(); // 记录结束时间
		const duration = (endTime - startTime) / 1000; // 毫秒转换为秒
		console.log(`转换耗时：${duration.toFixed(2)} 秒`);
	} catch (err) {
		console.error('无法读取源文件夹：', err);
	}
}

// 提示用户输入文件路径或文件夹路径
function promptUser() {
	rl.question('请输入源文件路径或源文件夹的路径：', async (sourcePath) => {
		// 检查输入路径是文件夹还是文件
		const isDirectory = fs.statSync(sourcePath).isDirectory();

		// 提示用户输入质量和是否删除源文件选项
		const quality = await promptQuality();
		const removeSource = await promptRemoveSource();

		if (isDirectory) {
			const targetFolder = await promptTargetFolder(sourcePath);
			await convertFolder(sourcePath, targetFolder, quality, removeSource);
		} else {
			await convertFile(sourcePath, quality, removeSource);
		}

		rl.close();
	});
}

// 提示用户输入质量
function promptQuality() {
	return new Promise((resolve) => {
		rl.question('请输入转换质量参数（默认为80）：', (quality) => {
			resolve(parseInt(quality) || 80);
		});
	});
}

// 提示用户是否删除源文件
function promptRemoveSource() {
	return new Promise((resolve) => {
		rl.question('是否删除源文件（y/n，默认为n）：', (removeSource) => {
			resolve(removeSource.toLowerCase().trim() === 'y');
		});
	});
}

// 提示用户输入目标文件夹
function promptTargetFolder(sourcePath) {
	return new Promise((resolve) => {
		rl.question(
			'请输入目标文件夹的路径（留空以使用默认输出路径，即与输入文件夹相同）：',
			(targetFolder) => {
				resolve(targetFolder || sourcePath);
			}
		);
	});
}

promptUser();
