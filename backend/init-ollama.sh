#!/bin/bash

# Ollama 初始化腳本
# 在容器啟動時自動下載所需的模型

echo "🚀 Ollama 初始化開始..."

# 等待 Ollama 服務就緒
echo "等待 Ollama 服務啟動..."
for i in {1..30}; do
  if curl -sf http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama 服務已就緒"
    break
  fi
  echo "等待中... ($i/30)"
  sleep 2
done

# 獲取模型名稱
MODEL=${OLLAMA_MODEL:-tinyllama:latest}
echo "📦 準備下載模型: $MODEL"

# 檢查模型是否已下載
echo "檢查模型是否已存在..."
if ollama list | grep -q "$MODEL"; then
  echo "✅ 模型 $MODEL 已存在，跳過下載"
else
  echo "⬇️  開始下載模型 $MODEL..."
  ollama pull "$MODEL"
  
  if [ $? -eq 0 ]; then
    echo "✅ 模型下載完成: $MODEL"
  else
    echo "❌ 模型下載失敗: $MODEL"
    exit 1
  fi
fi

echo "✅ Ollama 初始化完成"
echo "可用的模型："
ollama list

