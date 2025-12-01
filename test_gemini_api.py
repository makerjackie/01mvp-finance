#!/usr/bin/env python3
"""
测试 302.ai Gemini API 的脚本
"""

import os
import json
import requests
import base64
from pathlib import Path

# 配置
API_KEY = os.environ.get("GEMINI_IMAGE_API_KEY", "")
BASE_URL = os.environ.get("GEMINI_IMAGE_API_ENDPOINT", "https://api.302.ai")
MODEL_NAME = "gemini-3-pro-image-preview"

def test_302_format():
    """测试 302.ai 格式的 API"""
    print("=" * 60)
    print("测试 302.ai 格式 API")
    print("=" * 60)

    if not API_KEY:
        print("错误: 未设置 GEMINI_IMAGE_API_KEY 环境变量")
        return

    url = f"{BASE_URL}/google/v1/models/{MODEL_NAME}?response_format=url"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    }

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": "一只可爱的巨大桃子,手绘蜡笔风格,粗糙质感,粗黑轮廓,大圆眼睛,可爱简单的脸,鲜艳的蓝色背景"}
                ]
            }
        ],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
            "imageConfig": {
                "aspect_ratio": "16:9"
            }
        }
    }

    print(f"请求 URL: {url}")
    print(f"请求头: Authorization: Bearer {API_KEY[:10]}...")
    print(f"请求体:")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    print("\n发送请求中...")

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)

        print(f"\n状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")

        if response.status_code == 200:
            print("\n✅ 请求成功!")
            data = response.json()
            print("\n响应体:")
            print(json.dumps(data, indent=2, ensure_ascii=False))

            # 检查响应格式
            if "output" in data:
                print(f"\n✅ 找到 output 字段: {data['output'][:100]}...")
                return True
            elif "candidates" in data:
                print("\n⚠️  响应使用 Google 原始格式 (candidates)")
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    for part in parts:
                        if "inlineData" in part:
                            print("✅ 找到 inlineData")
                            return True
            else:
                print("\n❌ 未找到预期的响应格式")
                return False
        else:
            print(f"\n❌ 请求失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            return False

    except requests.exceptions.Timeout:
        print("\n❌ 请求超时")
        return False
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_google_original_format():
    """测试 Google 原始格式的 API"""
    print("\n" + "=" * 60)
    print("测试 Google 原始格式 API")
    print("=" * 60)

    if not API_KEY:
        print("错误: 未设置 GEMINI_IMAGE_API_KEY 环境变量")
        return

    # 如果使用 302.ai,需要用 /google/v1 前缀
    if "302.ai" in BASE_URL:
        url = f"{BASE_URL}/google/v1beta/models/{MODEL_NAME}:generateContent?key={API_KEY}"
    else:
        url = f"{BASE_URL}/v1beta/models/{MODEL_NAME}:generateContent?key={API_KEY}"

    headers = {
        "Content-Type": "application/json",
    }

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": "一只可爱的巨大桃子,手绘蜡笔风格,粗糙质感,粗黑轮廓,大圆眼睛,可爱简单的脸,鲜艳的蓝色背景"}
                ]
            }
        ],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
            "imageConfig": {
                "aspect_ratio": "16:9"
            }
        }
    }

    print(f"请求 URL: {url[:100]}...")
    print(f"请求体:")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    print("\n发送请求中...")

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)

        print(f"\n状态码: {response.status_code}")

        if response.status_code == 200:
            print("\n✅ 请求成功!")
            data = response.json()
            print("\n响应体 (前 500 字符):")
            response_text = json.dumps(data, indent=2, ensure_ascii=False)
            print(response_text[:500])

            # 检查响应格式
            if "candidates" in data:
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    for part in parts:
                        if "inlineData" in part:
                            print("\n✅ 找到 inlineData (base64 图片数据)")
                            return True
            else:
                print("\n❌ 未找到预期的响应格式")
                return False
        else:
            print(f"\n❌ 请求失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            return False

    except requests.exceptions.Timeout:
        print("\n❌ 请求超时")
        return False
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("Gemini 图片生成 API 测试")
    print(f"API Key: {API_KEY[:10] if API_KEY else '(未设置)'}...")
    print(f"Base URL: {BASE_URL}")
    print()

    # 测试 302.ai 格式
    result1 = test_302_format()

    # 测试 Google 原始格式
    result2 = test_google_original_format()

    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)
    print(f"302.ai 格式: {'✅ 通过' if result1 else '❌ 失败'}")
    print(f"Google 原始格式: {'✅ 通过' if result2 else '❌ 失败'}")
