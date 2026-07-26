import { describe, expect, test } from "bun:test";
import { parseChannelPlaylistsHtml, playlistContinuationToken, playlistVideoFromLockup } from "./youtube";

describe("YouTube playlist view models", () => {
  test("parses current video lockups", () => {
    const video = playlistVideoFromLockup({
      contentId: "video123",
      contentType: "LOCKUP_CONTENT_TYPE_VIDEO",
      contentImage: { thumbnailViewModel: { image: { sources: [{ url: "small" }, { url: "large" }] }, overlays: [{ thumbnailBadgeViewModel: { text: "12:34" } }] } },
      metadata: { lockupMetadataViewModel: {
        title: { content: "Title &amp; more" },
        metadata: { contentMetadataViewModel: { metadataRows: [{ metadataParts: [{ text: {
          content: "Creator",
          commandRuns: [{ onTap: { innertubeCommand: { browseEndpoint: { browseId: "UCcreator" } } } }],
        } }] }] } },
      } },
      rendererContext: { commandContext: { onTap: { innertubeCommand: { watchEndpoint: { index: 4 } } } } },
    }, 1);
    expect(video).toEqual({
      videoId: "video123", title: "Title & more", thumbnail: "large",
      channelTitle: "Creator", channelId: "UCcreator", duration: "12:34", index: 5,
    });
  });

  test("parses podcast lockups with kind podcast", () => {
    const data = {
      lockupViewModel: {
        contentId: "PLpodcast123",
        contentType: "LOCKUP_CONTENT_TYPE_PODCAST",
        contentImage: { collectionThumbnailViewModel: { primaryThumbnail: { thumbnailViewModel: {
          image: { sources: [{ url: "cover.jpg" }] },
          overlays: [{ thumbnailBadgeViewModel: { text: "121 episodes" } }],
        } } } },
        metadata: { lockupMetadataViewModel: { title: { content: "Office Hours &amp; more" } } },
      },
    };
    const html = `ytInitialData = ${JSON.stringify(data)}`;
    expect(parseChannelPlaylistsHtml(html)).toEqual([
      { playlistId: "PLpodcast123", title: "Office Hours & more", thumbnail: "cover.jpg", videoCount: "121 episodes", kind: "podcast" },
    ]);
  });

  test("parses playlist lockups with kind playlist", () => {
    const data = {
      lockupViewModel: {
        contentId: "PLplaylist123",
        contentType: "LOCKUP_CONTENT_TYPE_PLAYLIST",
        contentImage: { collectionThumbnailViewModel: { primaryThumbnail: { thumbnailViewModel: {
          image: { sources: [{ url: "thumb.jpg" }] },
          overlays: [{ thumbnailBadgeViewModel: { text: "10 videos" } }],
        } } } },
        metadata: { lockupMetadataViewModel: { title: { content: "My Playlist" } } },
      },
    };
    const html = `ytInitialData = ${JSON.stringify(data)}`;
    expect(parseChannelPlaylistsHtml(html)).toEqual([
      { playlistId: "PLplaylist123", title: "My Playlist", thumbnail: "thumb.jpg", videoCount: "10 videos", kind: "playlist" },
    ]);
  });

  test("reads current continuation view models", () => {
    expect(playlistContinuationToken({
      continuationItemViewModel: { continuationCommand: { innertubeCommand: { continuationCommand: { token: "next-page" } } } },
    })).toBe("next-page");
  });
});
