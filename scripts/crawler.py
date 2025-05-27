import requests
from bs4 import BeautifulSoup
import os
import re
import json

url = "https://sharechain.qq.com/0797cf9101220c78e37f0bfc2aefc277"

def get_mobile_content(url):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Mobile Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3",
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 获取note-content div中的文本
        note_content = soup.find('div', class_='note-content')
        if note_content:
            text_content = note_content.get_text()
            # 使用正则表达式提取链接和描述
            links = [re.split(r"\s*=>\s*", part.strip()) for part in text_content.split("|")]
            return links
        return None

    except Exception as e:
        print(f"错误详情: {str(e)}")
        return None

def save_to_json(data, filename='links.json'):
    try:
        # 指定保存到根目录的 data 文件夹
        data_dir = os.path.join(os.path.dirname(__file__), '../public')
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)  # 如果 data 文件夹不存在，则创建
        
        file_path = os.path.join(data_dir, filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"数据已成功保存到 {file_path}")
    except Exception as e:
        print(f"保存 JSON 文件时出错: {str(e)}")

def main():
    print("开始获取内容...")
    results = get_mobile_content(url)
    if results:
        # 将结果转换为更合适的 JSON 格式
        json_data = [
            {
                "title": item[0].strip(),
                "url": item[1].strip()
            }
            for item in results if len(item) >= 2
        ]
        save_to_json(json_data)
    else:
        print("未能获取到有效内容")

if __name__ == "__main__":
    main()
