/* ═══════════════════════════════════════════════════════════════════════
   booster-winner-integration.js  —  Winner Pack Handling for Booster Site
   
   Detects and processes battle winner pack codes (?pack=BATTLE_*)
   Integrates with existing pack-opener.html / _booster_index.html
   
   The booster site should include this script to support:
   • Special visual treatment for battle winner packs
   • Unique redemption tracking
   • Victory badge on opened cards
   ════════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  var WinnerPacks = window.WinnerPacks || {};

  // ── Parse winner pack from URL ────────────────────────
  function getWinnerPackFromURL() {
    var params = new URLSearchParams(window.location.search);
    var packParam = params.get('pack');
    
    if (packParam && packParam.startsWith('BATTLE_')) {
      return packParam;
    }
    
    // Also check sessionStorage (set by match-results.js)
    var stored = sessionStorage.getItem('battleWinnerPack');
    if (stored) {
      try {
        var packData = JSON.parse(stored);
        sessionStorage.removeItem('battleWinnerPack');
        return packData.packId;
      } catch (e) {}
    }
    
    return null;
  }

  // ── Check if pack is a battle winner pack ────────────
  function isBattleWinnerPack(packId) {
    return packId && packId.startsWith('BATTLE_');
  }

  // ── Get special pack metadata ────────────────────────
  function getBattlePackMetadata(packId) {
    if (!isBattleWinnerPack(packId)) return null;
    
    var parts = packId.split('_');
    return {
      isBattlePack: true,
      matchId: parts[1] || '',
      isVictoryPack: true,
      badge: 'victory',
      rarityBoost: 0.15  // 15% increased chance of better rarity
    };
  }

  // ── Initialize winner pack detection ─────────────────
  function init() {
    var winnerPackId = getWinnerPackFromURL();
    
    if (!winnerPackId) return;
    
    // Store metadata globally for pack opener to use
    window.currentWinnerPack = {
      packId: winnerPackId,
      metadata: getBattlePackMetadata(winnerPackId)
    };

    // Modify landing screen if pack opener is loaded
    setTimeout(function() {
      applyWinnerPackStyling(winnerPackId);
    }, 100);
  }

  // ── Apply special styling to battle pack ────────────
  function applyWinnerPackStyling(packId) {
    var sealedSection = document.getElementById('s-sealed');
    if (!sealedSection) return;

    var badge = document.createElement('div');
    badge.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 16px;
      border-radius: 99px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 18px;
      border: 1.5px solid;
      background: linear-gradient(135deg, rgba(180, 77, 223, 0.15) 0%, rgba(74, 125, 255, 0.15) 100%);
      color: #b44ddf;
      border-color: #b44ddf;
      animation: badgePulse 2s ease-in-out infinite;
    `;
    badge.innerHTML = `
      <i class="fas fa-crown" style="font-size: 0.75rem;"></i>
      <span>VICTORY PACK</span>
    `;

    // Insert after existing badge or at top of sealed section
    var existingBadge = sealedSection.querySelector('.src-badge');
    if (existingBadge) {
      existingBadge.parentNode.insertBefore(badge, existingBadge);
      existingBadge.remove();
    } else {
      var sealedInner = sealedSection.querySelector('.sealed-inner');
      if (sealedInner && sealedInner.firstChild) {
        sealedInner.insertBefore(badge, sealedInner.firstChild.nextSibling);
      }
    }

    // Enhance pack visual with glow
    var packWrap = sealedSection.querySelector('.pack-wrap');
    if (packWrap) {
      packWrap.style.filter = 'drop-shadow(0 0 20px rgba(180, 77, 223, 0.4))';
    }

    // Add animations if not already present
    if (!document.getElementById('winner-pack-styles')) {
      var style = document.createElement('style');
      style.id = 'winner-pack-styles';
      style.textContent = `
        @keyframes badgePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
        @keyframes packGlow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(180, 77, 223, 0.4)); }
          50% { filter: drop-shadow(0 0 30px rgba(180, 77, 223, 0.6)); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // ── Expose public API ────────────────────────────────
  WinnerPacks.isWinnerPack = function() {
    return !!getWinnerPackFromURL();
  };

  WinnerPacks.getWinnerPackId = function() {
    return getWinnerPackFromURL();
  };

  WinnerPacks.getMetadata = function() {
    var packId = getWinnerPackFromURL();
    return getBattlePackMetadata(packId);
  };

  WinnerPacks.getRarityBoost = function() {
    var metadata = WinnerPacks.getMetadata();
    return metadata ? metadata.rarityBoost : 0;
  };

  // Expose globally
  window.WinnerPacks = WinnerPacks;

  // Auto-init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
