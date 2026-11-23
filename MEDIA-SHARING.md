# ISKCON Hadapsar media buttons

Edit the config at the top of `temple-share.js` to change the app invitation URL, Hindi/Marathi/English message, or image. Use a site-relative image path or a direct HTTPS image. An empty image setting sends a text invitation. The receiving app decides whether it keeps the caption.

Include the script on a new page. The updated Android application also loads it on trusted pages after navigation. Put each button next to the item it operates on. Replace the example media paths with published files.

```html
<script src="/temple-share.js?v=2" defer></script>
<button data-temple-action="share-app">Share app</button>
<button data-temple-action="share-text" data-text="Join us for kirtan">Share invitation</button>
<button data-temple-action="share-image" data-url="/media/darshan.jpg" data-text="Today's darshan">Share photo</button>
<button data-temple-action="download" data-url="/media/kirtan.mp3" data-title="Morning kirtan">Download audio</button>
<button data-temple-action="download" data-url="/media/darshan.mp4" data-title="Darshan">Download video</button>
<button data-temple-action="save-image" data-url="/media/darshan.jpg">Save photo</button>
<button data-temple-action="ringtone" data-url="/media/kirtan.mp3" data-title="Morning kirtan">Set ringtone</button>
<button data-temple-action="wallpaper" data-url="/media/darshan.jpg">Set home wallpaper</button>
```

Dynamic galleries can call `TempleShare.shareImage(selectedPhotoUrl, caption)` directly from a click handler. Resolve the selected item before the tap and invoke the action synchronously so Android receives the tap. For text-only content call `TempleShare.shareText(message)`. Copy controls can remain separate.

Host new media on the app website for compatibility. Serve direct files with the correct image, audio or video MIME type. YouTube watch links and adaptive streaming playlists are playback links. Downloads go to **Download/ISKCON Hadapsar**. Setting a ringtone registers an audio copy in **Ringtones/ISKCON Hadapsar** and asks for Android system settings access when needed. Setting wallpaper affects the home screen. Sharing uses a temporary content URI. Website browsers use their available Web Share and file download capabilities.

Supported image attachments and wallpaper inputs are JPEG, PNG, WebP and GIF (10 MiB maximum). General downloads stream up to 512 MiB. Ringtone audio streams up to 32 MiB. New pages using these actions only require a website deployment after the native update is installed.
