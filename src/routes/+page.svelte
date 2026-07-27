<script>
	// Single door: "Entrar" leads to the profile picker, which itself routes a
	// first-time visitor on to founding the first Ætt when no profiles exist.
</script>

<!-- Signature: northern lights drifting over the fjord, the light of the Bifröst.
     Fixed to the viewport so it spans the full width on desktop too. -->
<div class="aurora" aria-hidden="true">
	<span class="band band-1"></span>
	<span class="band band-2"></span>
	<span class="band band-3"></span>
	<span class="band band-4"></span>
</div>

<div class="bifrost">
	<div class="gate">
		<img class="emblem" src="/favicon.png" alt="" width="120" height="120" />

		<div class="eyebrow">· Anno 1925 ·</div>
		<h1 class="wordmark">MORMORSSPILL</h1>

		<p class="tagline">
			Crea tu Ætt, reparte las cartas y conquista el trono ronda a ronda. Que las sagas recuerden
			quién reina.
		</p>

		<div class="runes" aria-hidden="true">ᛗ · ᛟ · ᚱ · ᛗ · ᛟ · ᚱ</div>

		<div class="actions">
			<a class="btn btn-primary" href="/login">Entrar</a>
		</div>
	</div>
</div>

<style>
	.aurora {
		position: fixed;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 0;
		-webkit-mask-image: linear-gradient(to bottom, transparent, #000 14%, #000 68%, transparent);
		mask-image: linear-gradient(to bottom, transparent, #000 14%, #000 68%, transparent);
	}
	.band {
		position: absolute;
		left: 50%;
		top: -8%;
		width: 130vw;
		max-width: 1700px;
		height: 56vh;
		border-radius: 46% 54% 50% 50% / 60% 58% 42% 40%;
		filter: blur(56px);
		mix-blend-mode: screen;
		will-change: transform, opacity;
	}
	.band-1 {
		background: radial-gradient(closest-side, var(--good), transparent 68%);
		opacity: 0.72;
		animation: curtain-a 19s ease-in-out infinite;
	}
	.band-2 {
		background: radial-gradient(closest-side, var(--special), transparent 68%);
		opacity: 0.58;
		animation: curtain-b 25s ease-in-out infinite;
	}
	.band-3 {
		background: radial-gradient(closest-side, var(--gold), transparent 70%);
		opacity: 0.42;
		animation: curtain-c 31s ease-in-out infinite;
	}
	.band-4 {
		background: radial-gradient(closest-side, var(--blood), transparent 72%);
		opacity: 0.36;
		animation: curtain-d 37s ease-in-out infinite;
	}
	@keyframes curtain-a {
		0%,
		100% {
			transform: translateX(-56%) translateY(-3%) scale(1) rotate(-6deg);
			opacity: 0.6;
		}
		50% {
			transform: translateX(-45%) translateY(4%) scale(1.16) rotate(-2deg);
			opacity: 0.82;
		}
	}
	@keyframes curtain-b {
		0%,
		100% {
			transform: translateX(-46%) translateY(3%) scale(1.12) rotate(4deg);
			opacity: 0.44;
		}
		50% {
			transform: translateX(-58%) translateY(-4%) scale(0.94) rotate(-4deg);
			opacity: 0.66;
		}
	}
	@keyframes curtain-c {
		0%,
		100% {
			transform: translateX(-52%) translateY(-2%) scale(1.06) rotate(-3deg);
			opacity: 0.34;
		}
		50% {
			transform: translateX(-43%) translateY(5%) scale(1.24) rotate(2deg);
			opacity: 0.52;
		}
	}
	@keyframes curtain-d {
		0%,
		100% {
			transform: translateX(-50%) translateY(4%) scale(1.2) rotate(5deg);
			opacity: 0.28;
		}
		50% {
			transform: translateX(-55%) translateY(-2%) scale(1) rotate(-5deg);
			opacity: 0.44;
		}
	}

	.bifrost {
		position: relative;
		z-index: 1;
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		/* Neutralize the .app wrapper padding (incl. safe-area insets) so the gate centers */
		margin: calc(-16px - env(safe-area-inset-top)) -16px calc(-104px - env(safe-area-inset-bottom));
		padding: 40px 22px;
	}

	.gate {
		text-align: center;
		max-width: 420px;
	}
	.emblem {
		filter: drop-shadow(0 8px 22px rgba(0, 0, 0, 0.6));
		margin-bottom: 6px;
	}
	.eyebrow {
		font-family: var(--font-display);
		text-transform: uppercase;
		letter-spacing: 0.3em;
		font-size: 0.74rem;
		color: var(--gold-soft);
		margin-bottom: 4px;
	}
	.wordmark {
		font-family: var(--font-jersey);
		font-size: clamp(2.6rem, 13vw, 4.2rem);
		line-height: 0.92;
		letter-spacing: 0.01em;
		margin: 0;
		color: var(--frost);
		text-shadow: 0 3px 0 rgba(0, 0, 0, 0.3);
	}
	.tagline {
		color: var(--stone);
		margin: 14px auto 0;
		max-width: 360px;
		line-height: 1.55;
	}
	.runes {
		color: var(--border);
		letter-spacing: 0.35em;
		font-size: 0.95rem;
		margin: 18px 0 22px;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 12px;
		max-width: 300px;
		margin: 0 auto;
	}

	@media (prefers-reduced-motion: reduce) {
		.band {
			animation: none !important;
			transform: translateX(-50%);
		}
	}
</style>
