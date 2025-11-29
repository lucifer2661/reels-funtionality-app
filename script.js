// script.js
document.addEventListener('DOMContentLoaded', () => {
  // ensure `reels` exists
  if (typeof reels === 'undefined' || !Array.isArray(reels)) {
    console.error('reels array not found. Make sure you defined "reels" before loading script.js');
    return;
  }

  // Build DOM inside .all-reels
  const container = document.querySelector('.all-reels');
  if (!container) {
    console.error('.all-reels container not found in DOM');
    return;
  }

  let html = '';
  reels.forEach((elem, idx) => {
    // ensure the icon element has a stable class "heart" and the remix class toggles
    const heartClass = elem.isLiked ? 'ri-heart-fill liked' : 'ri-heart-line';
    const followText = elem.isFollowed ? 'Unfollow' : 'Follow';
    html += `
      <div class="reel" data-index="${idx}">
        <video autoplay loop muted src="${elem.video}"></video>

        <div class="bottom">
          <div class="user">
            <img src="${elem.userProfile}" alt="${elem.username}">
            <h4>${elem.username}</h4>
            <button class="follow-btn">${followText}</button>
          </div>
          <h3>${elem.caption}</h3>
        </div>

        <div class="right">
          <div class="like">
            <h4 class="like-icon icon"><i class="heart ${heartClass}"></i></h4>
            <h6 class="like-count">${elem.likeCount}</h6>
          </div>

          <div class="comment">
            <h4 class="comment-icon icon"><i class="ri-chat-ai-fill"></i></h4>
            <h6 class="comment-count">${elem.commentCount}</h6>
          </div>

          <div class="share">
            <h4 class="share-icon icon"><i class="ri-share-fill"></i></h4>
            <h6 class="share-count">${elem.shareCount}</h6>
          </div>

          <div class="menu">
            <h4 class="menu-icon icon"><i class="ri-more-2-line"></i></h4>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Cache reels DOM
  let reelElements = Array.from(document.querySelectorAll('.reel'));
  let totalReels = reelElements.length;
  let currentIndex = 0;

  // helper: update DOM for one reel from state
  function updateReelDOM(index) {
    const reelEl = document.querySelector(`.reel[data-index="${index}"]`);
    if (!reelEl) return;

    const likeI = reelEl.querySelector('.like-icon i.heart');
    const likeCountEl = reelEl.querySelector('.like-count');
    const followBtn = reelEl.querySelector('.follow-btn');

    // update like icon classes
    if (reels[index].isLiked) {
      likeI.classList.add('liked');
      likeI.classList.remove('ri-heart-line');
      likeI.classList.add('ri-heart-fill');
    } else {
      likeI.classList.remove('liked');
      likeI.classList.remove('ri-heart-fill');
      likeI.classList.add('ri-heart-line');
    }

    // update counts and follow text
    likeCountEl.textContent = reels[index].likeCount;
    followBtn.textContent = reels[index].isFollowed ? 'Unfollow' : 'Follow';
  }

  // show reel (scroll + play video)
  function showReel(index) {
    if (index < 0 || index >= totalReels) return;
    currentIndex = index;

    // Scroll the reel into view (center it nicely)
    reelElements[index].scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    // Pause all videos, play only current
    document.querySelectorAll('.reel video').forEach(v => v.pause());
    const currentVideo = reelElements[index].querySelector('video');
    if (currentVideo) {
      // small delay to let scroll finish and video to be ready
      setTimeout(() => currentVideo.play().catch(() => {}), 80);
    }
  }

  // Arrow navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      if (currentIndex < totalReels - 1) showReel(currentIndex + 1);
    } else if (e.key === 'ArrowUp') {
      if (currentIndex > 0) showReel(currentIndex - 1);
    }
  });

  // Event delegation for like & follow (fast, single listener)
  container.addEventListener('click', (ev) => {
    const reelEl = ev.target.closest('.reel');
    if (!reelEl) return;
    const idx = Number(reelEl.dataset.index);
    if (!Number.isFinite(idx)) return;

    // FOLLOW button
    if (ev.target.matches('.follow-btn') || ev.target.closest('.follow-btn')) {
      // toggle state
      reels[idx].isFollowed = !reels[idx].isFollowed;
      // update DOM
      updateReelDOM(idx);

      // optional: call server to persist follow state (commented)
      // fetch('/api/follow', { method: 'POST', body: JSON.stringify({ user: reels[idx].username, follow: reels[idx].isFollowed }) });
      return;
    }

    // LIKE icon (allow clicking on <h4>, <i> or the container)
    if (ev.target.matches('.like-icon') || ev.target.closest('.like-icon') || ev.target.matches('.heart') || ev.target.closest('.heart')) {
      const heartI = reelEl.querySelector('.like-icon i.heart');
      if (!heartI) return;

      // toggle state + update count
      if (reels[idx].isLiked) {
        reels[idx].isLiked = false;
        reels[idx].likeCount = Math.max(0, reels[idx].likeCount - 1);
      } else {
        reels[idx].isLiked = true;
        reels[idx].likeCount = reels[idx].likeCount + 1;

        // small hack: re-trigger animation when liked repeatedly
        heartI.classList.remove('liked');
        // force reflow to restart animation
        // eslint-disable-next-line no-unused-expressions
        void heartI.offsetWidth;
      }

      // add liked class and update remix classes
      if (reels[idx].isLiked) {
        heartI.classList.add('liked');
        heartI.classList.remove('ri-heart-line');
        heartI.classList.add('ri-heart-fill');
      } else {
        heartI.classList.remove('liked');
        heartI.classList.remove('ri-heart-fill');
        heartI.classList.add('ri-heart-line');
      }

      // update count in DOM
      const likeCountEl = reelEl.querySelector('.like-count');
      if (likeCountEl) likeCountEl.textContent = reels[idx].likeCount;

      // optional: lightly pulse the heart (animation handled by CSS)
      return;
    }

    // other clicks (comment/share) can be handled similarly...
  });

  // autoplay the first reel
  reelElements = Array.from(document.querySelectorAll('.reel'));
  totalReels = reelElements.length;
  showReel(0);

  // keep currentIndex in sync when user scrolls manually (optional)
  let scrollTimeout = null;
  container.addEventListener('scroll', () => {
    // debounce to find current centered reel after scrolling stops
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      // find reel whose bounding rect is closest to center of container
      const centerY = container.getBoundingClientRect().top + container.clientHeight / 2;
      let closestIdx = currentIndex;
      let closestDist = Infinity;
      reelElements.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const dist = Math.abs((rect.top + rect.bottom) / 2 - centerY);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      });
      if (closestIdx !== currentIndex) {
        showReel(closestIdx);
      }
    }, 120);
  });

});
