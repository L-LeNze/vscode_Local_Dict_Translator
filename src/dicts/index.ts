// 1. 修改导入的路径和文件名
import { algoDict } from './algorithm'; // 注意这里路径改成了 ./algorithm
import { cppDict } from './cpp';
import { ojDict } from './oj';
import { cet4Dict } from './cet4';
import { varsDict } from './variable'; // 注意这里引入了新的 variable.ts
import { problemDict } from './problem';

// 2. 合并所有词典
export const dictData: Record<string, { en: string, ipa: string }> = {
  ...algoDict,
  ...cppDict,
  ...ojDict,
  ...cet4Dict,
  ...varsDict, // 把新增的变量字典也展开合并进来
  ...problemDict,
};