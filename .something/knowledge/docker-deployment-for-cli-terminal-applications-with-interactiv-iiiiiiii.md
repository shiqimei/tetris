# UUID
e5454198-7071-46ac-9fe3-3dd09a5d84ae

# Trigger
Docker deployment for CLI terminal applications with interactive controls

# Content
When deploying CLI applications that require interactive terminal input (like games with keyboard controls) in Docker:

1. **Volume Mount Strategy**: Use volume mounts for development/testing rather than copying files into the image, as CLI apps often need source code access for dynamic behavior
2. **Interactive Flags Required**: Always use `docker run -it` (interactive + tty) for proper terminal emulation
3. **Working Directory**: Set working directory to the volume mount point (e.g., `-w /app`) when using volume mounts
4. **Terminal Environment**: Set `TERM=xterm-256color` environment variable for proper color support
5. **Port Exposure**: CLI apps don't need exposed ports, but include placeholder port (3000) for consistency
6. **Example Command**: `docker run -it --rm -v $(pwd):/app -w /app your-image:tag`

This approach provides flexibility for CLI applications while maintaining Docker containerization benefits.