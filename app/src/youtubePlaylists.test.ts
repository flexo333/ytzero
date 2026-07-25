import { describe, expect, test } from "bun:test";
import { parseChannelPlaylistsHtml, playlistContinuationToken, playlistIdFromLockup, playlistVideoFromLockup } from "./youtube";

/** Wrap view models the way a channel's playlists tab embeds them. */
function channelPlaylistsHtml(lockups: unknown[]): string {
  const data = {
    contents: { twoColumnBrowseResultsRenderer: { tabs: [{ tabRenderer: { content: { richGridRenderer: {
      contents: lockups.map((lockupViewModel) => ({ richItemRenderer: { content: { lockupViewModel } } })),
    } } } }] } },
  };
  return `<script>var ytInitialData = ${JSON.stringify(data)};</script>`;
}

const playlistLockup = {
  contentType: "LOCKUP_CONTENT_TYPE_PLAYLIST",
  contentId: "PLplaylist",
  contentImage: { collectionThumbnailViewModel: { primaryThumbnail: { thumbnailViewModel: {
    image: { sources: [{ url: "https://i.ytimg.com/playlist.jpg" }] },
    overlays: [{ thumbnailOverlayBadgeViewModel: { thumbnailBadges: [{ thumbnailBadgeViewModel: { text: "12 videos" } }] } }],
  } } } },
  metadata: { lockupMetadataViewModel: { title: { content: "Best of &amp; more" } } },
};

// Podcasts render as their own lockup type on the playlists tab, and link
// through a browse endpoint rather than exposing a bare playlist id.
const podcastLockup = {
  contentType: "LOCKUP_CONTENT_TYPE_PODCAST",
  contentId: "PLpodcast",
  contentImage: { collectionThumbnailViewModel: { primaryThumbnail: { thumbnailViewModel: {
    image: { sources: [{ url: "https://i.ytimg.com/podcast.jpg" }] },
    overlays: [{ thumbnailOverlayBadgeViewModel: { thumbnailBadges: [{ thumbnailBadgeViewModel: { text: "48 episodes" } }] } }],
  } } } },
  metadata: { lockupMetadataViewModel: { title: { content: "The Show" } } },
  rendererContext: { commandContext: { onTap: { innertubeCommand: { browseEndpoint: { browseId: "VLPLpodcast" } } } } },
};

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

  test("collects podcasts alongside plain playlists", () => {
    expect(parseChannelPlaylistsHtml(channelPlaylistsHtml([playlistLockup, podcastLockup]))).toEqual([
      { playlistId: "PLplaylist", title: "Best of & more", thumbnail: "https://i.ytimg.com/playlist.jpg", videoCount: "12 videos" },
      { playlistId: "PLpodcast", title: "The Show", thumbnail: "https://i.ytimg.com/podcast.jpg", videoCount: "48 episodes" },
    ]);
  });

  test("ignores non-list lockups on the playlists tab", () => {
    const html = channelPlaylistsHtml([{ contentType: "LOCKUP_CONTENT_TYPE_VIDEO", contentId: "video123" }]);
    expect(parseChannelPlaylistsHtml(html)).toEqual([]);
  });

  test("falls back to the browse endpoint for a podcast's list id", () => {
    expect(playlistIdFromLockup({ ...podcastLockup, contentId: "VLPLpodcast" })).toBe("PLpodcast");
    expect(playlistIdFromLockup({ contentId: "PLplain" })).toBe("PLplain");
    expect(playlistIdFromLockup({})).toBe("");
  });

  test("reads current continuation view models", () => {
    expect(playlistContinuationToken({
      continuationItemViewModel: { continuationCommand: { innertubeCommand: { continuationCommand: { token: "next-page" } } } },
    })).toBe("next-page");
  });
});
