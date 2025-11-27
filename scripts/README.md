# Screenshot Management

This directory contains scripts for managing demo screenshots.

## Capturing Screenshots

### Prerequisites
- Development server must be running (`pnpm dev`)
- All demo pages should be accessible at their routes

### Running the Screenshot Script

```bash
# Make sure dev server is running first
pnpm dev

# In another terminal, capture screenshots
pnpm screenshots
```

This will:
1. Launch a headless Chrome browser
2. Navigate to each demo page
3. Wait for content to load
4. Capture a 1280x800 screenshot
5. Save to `public/screenshots/`

### Output

Screenshots are saved as:
- `public/screenshots/tbff.png`
- `public/screenshots/tbff-flow.png`
- `public/screenshots/flow-v2.png`
- `public/screenshots/italism.png`
- `public/screenshots/flowfunding.png`

### Adding New Demos

To capture screenshots for new demos, edit `capture-screenshots.mjs`:

```javascript
const demos = [
  { path: '/your-new-demo', name: 'your-new-demo' },
  // ... existing demos
];
```

Then update `app/demos/page.tsx` to include the screenshot path:

```typescript
{
  title: 'Your New Demo',
  path: '/your-new-demo',
  screenshot: '/screenshots/your-new-demo.png',
  // ... other properties
}
```

## Screenshot Specifications

- **Viewport**: 1280x800 pixels
- **Format**: PNG
- **Wait Time**: 2 seconds after page load (for animations to settle)
- **Network**: Waits for networkidle2 (most network activity finished)

## Customization

### Changing Viewport Size

Edit the viewport in `capture-screenshots.mjs`:

```javascript
await page.setViewport({
  width: 1920,  // Change width
  height: 1080  // Change height
});
```

### Changing Wait Time

Adjust the timeout if demos need more time to render:

```javascript
await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds
```

### Capturing Specific Section

To capture only part of a page:

```javascript
const element = await page.$('.demo-container');
await element.screenshot({ path: screenshotPath });
```

## Troubleshooting

### Screenshots are blank
- Increase wait time
- Check if content loads in actual browser
- Ensure dev server is running

### Browser launch fails
- Check if puppeteer installed: `pnpm list puppeteer`
- Reinstall: `pnpm add -D puppeteer`
- Check system dependencies for Chrome

### Timeout errors
- Increase timeout in script:
  ```javascript
  timeout: 60000  // 60 seconds
  ```

## Manual Screenshot Workflow

If automated screenshots don't work:

1. Open demo in browser
2. Set window to 1280x800
3. Use browser screenshot tool (F12 → Device Toolbar → Screenshot)
4. Save to `public/screenshots/[demo-name].png`
5. Update demo card with screenshot path

## Performance Tips

- Screenshots are cached by browser
- Total size: ~560KB for 5 demos
- Consider optimizing PNGs with tools like `pngquant` or `imagemin`
- WebP format could reduce size further

## Future Enhancements

- [ ] Generate thumbnails in addition to full screenshots
- [ ] Add WebP format support
- [ ] Capture at multiple viewport sizes
- [ ] Add screenshot comparison for regression testing
- [ ] Automate screenshot capture on build
- [ ] Add screenshot update on demo changes (CI/CD)
