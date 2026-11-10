-- A real win: PIXX-AR at HackMIT 2026 (September 19-20), Visa's "Reimagine Shopping" sponsor prize.
-- Wins are normally added in the portal; this one comes in with its photo (public/wins/pixx-ar.jpg),
-- so the row and the image reach production in the same deploy. It can be edited in the portal after.
INSERT INTO wins (project, blurb, event, date, placement, track, team, photo, gallery, description, stack, github, devpost, funding, next_steps, position, placeholder, published)
SELECT
  'PIXX-AR',
  'The future of shopping is spatial. Photograph your room, say what you have in mind, and PIXX-AR finds real furniture that matches, previews it in the room at true size, checks it fits through your door, and builds one basket across retailers.',
  'HackMIT 2026',
  '2026-09-20',
  'Winner, Visa: Reimagine Shopping',
  'Entertainment',
  '[{"name": "Arshiya Sharma", "href": null, "bu": false}, {"name": "Jose Cruz-Lopez", "href": "https://devpost.com/jose-colorstack", "bu": true}, {"name": "Yashasree Gadipalli", "href": null, "bu": false}, {"name": "Yutian Gong", "href": null, "bu": false}]',
  '/wins/pixx-ar.jpg',
  '[]',
  'Inspiration

Have you ever wanted to design something about your room, but had no idea where to find items? Maybe you know the vibe, but translating that into product names, dimensions, colors, and hundreds of searches across retailers is impossible.

That''s what led us to PIXX-AR. It begins with your room. Users take a photo of their space and describe what they have in mind, as vague or specific as possible. PIXX-AR analyzes the room''s existing style, colors, lighting, and function, then translates that context into practical shopping terms.

From there, it finds real matching furniture from online retailers and generates a library for users to visualize. You can preview how the furniture looks in the room, visualize appropriate dimensions, compare options, check whether it can physically fit through your doorway or hallway, track your budget, and assemble a multi-retailer basket.

Most shopping tools help people visualize a product they have already found. PIXX-AR helps people discover WHAT they are looking for. Users set their budget once and never think about the cumbersome and scattered buying experience again!

What it does

PIXX-AR turns a room photo and a natural-language idea into a spatial shopping experience. A user first takes or uploads a photo of their room. Our vision pipeline analyzes the image and extracts a room type, lighting profile, color palette, style descriptors, and suggestions for what the room could use.

The user can then make a request such as: "I want a tall lamp in this corner."

PIXX-AR normalizes that request into a searchable product category, combines it with the room''s visual context, and searches for real products available online. Results include retailer links, prices, images, and dimensions when those dimensions are available.

Before the search finishes, PIXX-AR can generate a context-aware stand-in so the user immediately sees an object appear in the simulated 3D room. Once real listings arrive, users can hover over different options to preview their sizes, select a product, move it, resize it, rotate it, and replace the stand-in with the product image.

Selected products are added to a shared room basket. PIXX-AR tracks the remaining budget, checks the product''s dimensions against doorway, hallway, stairway, and ceiling measurements, and clearly distinguishes between quoted, estimated, and missing measurements.

At checkout, eligible products are grouped by retailer. A single approval starts a server-side, multi-retailer checkout run. Our prototype also demonstrates cryptographic agent identity through Visa''s Trusted Agent Protocol and supports Visa sandbox authorization when configured. Purchases remain explicitly labeled as simulated in test mode.

How we built it

We built PIXX-AR as a full-stack application using Next.js 16, React 19, TypeScript, Zustand, Three.js, React Three Fiber, and React Three XR. Before writing any code, we wanted to make sure we were solving a real problem. We interviewed over 25 students about their experiences shopping for furniture, focusing on the challenges they faced when deciding what to buy. To further validate the idea, we launched a pre-launch website and received over 70 sign-ups, and we have already iterated twice on PIXX-AR to fit what we heard.

The workflow connects several specialized systems:
- Room understanding: Gemini reads the photo into structured context: style, color, lighting, room type, and suggestions, with model fallbacks so a single failure never blocks the flow.
- Language to category: a deterministic layer turns phrases like "somewhere to sit" into consistent product categories and silhouettes.
- Product discovery: SerpAPI searches Google Shopping using the request plus the room''s style and color context; Elasticsearch caches results for faster repeat searches.
- Spatial visualization: a stand-in or real product renders inside a shallow 3D scene, scaled to the listing''s real dimensions, and updates live as you swap listings.
- Fit and budget: a geometry engine checks product dimensions against doorway, hallway, landing, and ceiling measurements, while shared state tracks basket, price, and remaining budget.
- Agentic checkout: basket items are grouped by retailer and processed server-side, with Ed25519-signed requests under Visa''s Trusted Agent Protocol and sandbox authorization.

Who did what

- Arshiya Sharma: the original room-aesthetic analysis and search handoff, connecting room-image understanding to product discovery, and the move to the PIXX-AR identity.
- Jose Cruz-Lopez: the core frontend and spatial room experience (product placement, generated stand-ins, dimension-aware previews, fit visualization, visual and motion design), plus the live search and room-analysis pipelines.
- Yashasree Gadipalli: the application foundation and major backend systems, including authentication, basket and checkout orchestration, parallel multi-retailer processing, and budget safeguards.
- Yutian Gong: early product sourcing and retailer-page scraping, search performance and result handling, the AR workflow, and the Google authentication backend.

Challenges we ran into

One of our largest challenges was converting subjective visual language into useful shopping queries. Models often returned interior-design vocabulary that sounded intelligent but performed poorly in retailer searches. We had to constrain and filter the model''s output into practical terms such as "warm wood," "brass," or "vintage."

Real product data was another major obstacle. Retailers expose dimensions in inconsistent formats, hide them inside dynamic pages, or omit them completely. We built a normalization and scraping pipeline that preserves the source of every measurement and refuses to present a fit verdict when reliable dimensions are unavailable.

Latency also affected nearly every part of the experience. Vision analysis, shopping search, page scraping, image generation, and background removal can each take several seconds. We introduced model fallbacks, parallel searches, strict timeouts, cached generated assets, Elasticsearch-backed reuse, and immediate stand-ins so the interface continues responding while slower work finishes.

Finally, spatial visualization from a single photograph required careful compromises. A single image does not provide a complete 3D reconstruction or reliable room measurements. We therefore created a controllable shallow 3D scene and scale products using their listed dimensions while clearly separating user-adjusted placement from verified measurements.

What we''re proud of

PIXX-AR is not simply a room visualizer or a shopping search interface: it connects the entire journey from an ambiguous idea to a spatially informed basket, with real listings, fit checks, budget tracking and a signed, sandboxed checkout.

We are especially proud of the system''s honesty. PIXX-AR identifies whether dimensions were quoted, estimated, or missing; labels frozen demo listings; distinguishes generated imagery from product imagery; marks checkout as test mode; and does not claim that a simulated order or authorization is a completed purchase.

What we learned

Spatial commerce is not one problem: it is a chain of tightly connected problems. Room understanding is only useful if it produces language that product search engines understand. Search results are only useful if their dimensions and links are trustworthy. Visualization is only meaningful if scale is connected to those dimensions. Agentic checkout is only credible if identity, authorization, and system limitations are transparent.

We also learned that combining deterministic systems with generative AI produces a stronger product than relying on either alone. AI is valuable for interpreting a room and generating visual stand-ins, while deterministic logic is better for category normalization, price calculations, fit checks, budgets, signatures, and payment safeguards.

Try it

pixxar.vercel.app',
  '["Next.js", "React", "TypeScript", "Zustand", "Three.js", "React Three Fiber", "React Three XR", "Gemini", "SerpAPI", "Elasticsearch", "Visa Trusted Agent Protocol"]',
  NULL,
  NULL,
  '',
  'Our next step is to evolve PIXX-AR from a single-photo spatial preview into a richer understanding of the entire room. We want to add depth estimation, surface detection, automatic floor and wall anchoring, object occlusion, and multi-angle room capture. This would allow products to sit more naturally behind existing furniture and reduce the amount of manual placement required.

We also plan to generate or retrieve full 3D product assets rather than relying primarily on dimension-scaled cutouts. With stronger retailer partnerships, PIXX-AR could access verified product geometry, inventory, delivery constraints, and supported checkout APIs directly. Additional goals include collaborative room boards, multiple design variations, recommendation explanations, accessibility-aware layouts, delivery and assembly planning, and native mobile AR support.

On the commerce side, we want to complete Visa Intelligent Commerce and token-service onboarding, connect the existing mandate infrastructure to live credentials, and partner with retailers that support authenticated agent checkout. Our long-term vision is for users to approve a budget and a set of constraints once, then let a trusted shopping agent safely coordinate the rest, from discovery and spatial validation to delivery.',
  (SELECT COALESCE(MAX(position), -1) + 1 FROM wins),
  0,
  1
WHERE NOT EXISTS (SELECT 1 FROM wins WHERE project = 'PIXX-AR' AND event = 'HackMIT 2026');
