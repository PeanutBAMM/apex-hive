#!/bin/bash
# Fix the regex line in mcp-filesystem-cached.js
sed -i '838s/.*/                const regex = new RegExp(edit.oldText.replace(\/[.*+?^${}()|[\\]\\\\]\/g, '\''\\\\$\&'\''), '\''g'\'');/' mcp-filesystem-cached.js