<script>
	// Single door: "Entrar" leads to the profile picker, which itself routes a
	// first-time visitor on to founding the first Ætt when no profiles exist.
</script>

<!-- Northern-lights ray curtains; fixed to the viewport to span the full width. -->
<div class="aurora" aria-hidden="true">
	<div class="curtains">
		<span class="curtain c1"></span>
		<span class="curtain c2"></span>
		<span class="curtain c3"></span>
		<span class="curtain c4"></span>
		<span class="glow"></span>
	</div>
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
			<a class="btn btn-primary" href="/login">Empezar</a>
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
		-webkit-mask-image: linear-gradient(to bottom, transparent, #000 12%, #000 44%, transparent 64%);
		mask-image: linear-gradient(to bottom, transparent, #000 12%, #000 44%, transparent 64%);
	}
	.curtains {
		position: absolute;
		left: -30%;
		right: -30%;
		top: -32%;
		height: 84vh;
	}

	.curtain {
		position: absolute;
		mix-blend-mode: screen;
		will-change: transform, opacity;
	}
	.c1 {
		left: -8%;
		width: 56%;
		top: -2%;
		height: 100%;
		transform-origin: 35% 100%;
		background: linear-gradient(
			to top,
			transparent 4%,
			rgba(52, 205, 150, 0.66) 26%,
			rgba(86, 226, 190, 0.5) 46%,
			rgba(120, 180, 255, 0.3) 66%,
			rgba(167, 139, 250, 0.2) 80%,
			transparent 94%
		);
		-webkit-mask-image:
			repeating-linear-gradient(93deg, transparent 0px, transparent 30px, rgba(0, 0, 0, 0.55) 50px, #000 66px, rgba(0, 0, 0, 0.55) 82px, transparent 108px),
			linear-gradient(88deg, transparent, #000 16%, rgba(0, 0, 0, 0.3) 38%, #000 60%, rgba(0, 0, 0, 0.12) 82%, transparent);
		-webkit-mask-composite: source-in;
		mask-image:
			repeating-linear-gradient(93deg, transparent 0px, transparent 30px, rgba(0, 0, 0, 0.55) 50px, #000 66px, rgba(0, 0, 0, 0.55) 82px, transparent 108px),
			linear-gradient(88deg, transparent, #000 16%, rgba(0, 0, 0, 0.3) 38%, #000 60%, rgba(0, 0, 0, 0.12) 82%, transparent);
		mask-composite: intersect;
		filter: blur(16px);
		opacity: 0.92;
		animation: sway-a 27s ease-in-out infinite, flicker-a 8.3s ease-in-out infinite;
	}
	.c2 {
		left: 34%;
		width: 68%;
		top: 4%;
		height: 92%;
		transform-origin: 65% 100%;
		background: linear-gradient(
			to top,
			transparent 7%,
			rgba(58, 200, 180, 0.5) 30%,
			rgba(96, 214, 235, 0.42) 50%,
			rgba(150, 158, 250, 0.3) 72%,
			transparent 92%
		);
		-webkit-mask-image:
			repeating-linear-gradient(85deg, transparent 0px, transparent 46px, rgba(0, 0, 0, 0.5) 70px, #000 88px, rgba(0, 0, 0, 0.5) 106px, transparent 150px),
			linear-gradient(93deg, rgba(0, 0, 0, 0.15), #000 26%, rgba(0, 0, 0, 0.08) 48%, #000 72%, rgba(0, 0, 0, 0.4) 92%);
		-webkit-mask-composite: source-in;
		mask-image:
			repeating-linear-gradient(85deg, transparent 0px, transparent 46px, rgba(0, 0, 0, 0.5) 70px, #000 88px, rgba(0, 0, 0, 0.5) 106px, transparent 150px),
			linear-gradient(93deg, rgba(0, 0, 0, 0.15), #000 26%, rgba(0, 0, 0, 0.08) 48%, #000 72%, rgba(0, 0, 0, 0.4) 92%);
		mask-composite: intersect;
		filter: blur(24px);
		opacity: 0.7;
		animation: sway-b 35s ease-in-out infinite, flicker-b 10.7s ease-in-out infinite;
	}
	.c3 {
		left: 6%;
		width: 46%;
		top: -4%;
		height: 106%;
		transform-origin: 55% 100%;
		background: linear-gradient(
			to top,
			transparent 10%,
			rgba(80, 200, 160, 0.32) 34%,
			rgba(150, 150, 255, 0.4) 60%,
			rgba(196, 140, 250, 0.36) 78%,
			transparent 95%
		);
		-webkit-mask-image:
			repeating-linear-gradient(103deg, transparent 0px, transparent 24px, rgba(0, 0, 0, 0.5) 42px, #000 56px, rgba(0, 0, 0, 0.5) 70px, transparent 94px),
			linear-gradient(87deg, #000 6%, rgba(0, 0, 0, 0.1) 30%, #000 52%, rgba(0, 0, 0, 0.28) 72%, #000 92%, transparent);
		-webkit-mask-composite: source-in;
		mask-image:
			repeating-linear-gradient(103deg, transparent 0px, transparent 24px, rgba(0, 0, 0, 0.5) 42px, #000 56px, rgba(0, 0, 0, 0.5) 70px, transparent 94px),
			linear-gradient(87deg, #000 6%, rgba(0, 0, 0, 0.1) 30%, #000 52%, rgba(0, 0, 0, 0.28) 72%, #000 92%, transparent);
		mask-composite: intersect;
		filter: blur(30px);
		opacity: 0.6;
		animation: sway-c 44s ease-in-out infinite, flicker-c 13.1s ease-in-out infinite;
	}
	.c4 {
		left: 62%;
		width: 40%;
		top: -2%;
		height: 98%;
		transform-origin: 50% 100%;
		background: linear-gradient(
			to top,
			transparent 8%,
			rgba(70, 210, 175, 0.4) 32%,
			rgba(130, 170, 255, 0.36) 58%,
			rgba(196, 140, 250, 0.3) 78%,
			transparent 95%
		);
		-webkit-mask-image:
			repeating-linear-gradient(98deg, transparent 0px, transparent 26px, rgba(0, 0, 0, 0.5) 44px, #000 58px, rgba(0, 0, 0, 0.5) 72px, transparent 100px),
			linear-gradient(85deg, transparent, #000 22%, rgba(0, 0, 0, 0.2) 46%, #000 70%, rgba(0, 0, 0, 0.35) 90%, transparent);
		-webkit-mask-composite: source-in;
		mask-image:
			repeating-linear-gradient(98deg, transparent 0px, transparent 26px, rgba(0, 0, 0, 0.5) 44px, #000 58px, rgba(0, 0, 0, 0.5) 72px, transparent 100px),
			linear-gradient(85deg, transparent, #000 22%, rgba(0, 0, 0, 0.2) 46%, #000 70%, rgba(0, 0, 0, 0.35) 90%, transparent);
		mask-composite: intersect;
		filter: blur(22px);
		opacity: 0.66;
		animation: sway-b 39s ease-in-out infinite, flicker-d 9.7s ease-in-out infinite;
	}
	.glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			120% 70% at 50% 8%,
			rgba(70, 200, 150, 0.28),
			rgba(120, 150, 255, 0.12) 42%,
			transparent 70%
		);
		mix-blend-mode: screen;
		filter: blur(30px);
		animation: breathe 18s ease-in-out infinite;
	}

	@keyframes sway-a {
		0%,
		100% {
			transform: translate(-6%, -1%) scale(1, 0.99);
		}
		50% {
			transform: translate(5%, 1%) scale(1.06, 1.12);
		}
	}
	@keyframes sway-b {
		0%,
		100% {
			transform: translate(6%, 1%) scale(1.04, 1.08);
		}
		50% {
			transform: translate(-5%, -2%) scale(0.98, 0.94);
		}
	}
	@keyframes sway-c {
		0%,
		100% {
			transform: translate(-3%, 2%) scale(1, 1.04);
		}
		50% {
			transform: translate(3%, -1%) scale(1.05, 1.18);
		}
	}
	@keyframes flicker-a {
		0%, 100% { opacity: 0.5; }
		22% { opacity: 0.95; }
		40% { opacity: 0.62; }
		63% { opacity: 0.88; }
		82% { opacity: 0.55; }
	}
	@keyframes flicker-b {
		0%, 100% { opacity: 0.4; }
		30% { opacity: 0.78; }
		48% { opacity: 0.5; }
		70% { opacity: 0.82; }
		88% { opacity: 0.58; }
	}
	@keyframes flicker-c {
		0%, 100% { opacity: 0.36; }
		18% { opacity: 0.66; }
		45% { opacity: 0.44; }
		68% { opacity: 0.7; }
		90% { opacity: 0.5; }
	}
	@keyframes flicker-d {
		0%, 100% { opacity: 0.44; }
		26% { opacity: 0.72; }
		52% { opacity: 0.5; }
		74% { opacity: 0.8; }
		92% { opacity: 0.6; }
	}
	@keyframes breathe {
		0%,
		100% {
			opacity: 0.55;
			transform: scale(1);
		}
		50% {
			opacity: 0.9;
			transform: scale(1.08);
		}
	}

	.bifrost {
		position: relative;
		z-index: 1;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		/* Neutralize the .app wrapper padding (incl. safe-area insets) so the gate centers */
		margin: calc(-16px - env(safe-area-inset-top)) -16px calc(-104px - env(safe-area-inset-bottom));
		/* Extra top padding drops the gate to ~the lower golden-ratio line (~60% down). */
		padding: calc(40px + 20dvh) 22px 40px;
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
		.curtain,
		.glow {
			animation: none !important;
		}
	}
</style>
