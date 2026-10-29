"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  formatPrice,
  MAX_QUANTITY,
  type Category,
  type Design,
  type DesignSummary,
} from "@/lib/catalog";
import { startCheckout, useCart } from "./Cart";

type Props = { category: Category; designs: DesignSummary[]; design: Design };

type Selection = {
  designId: string;
  colorId: number | null;
  sizeId: number | null;
  /** Title of the chosen size, carried over when switching designs. */
  sizeTitle: string | null;
  view: number;
};

function initialSelection(design: Design, previousSize?: string | null): Selection {
  const defaultVariant = design.variants.find((variant) => variant.id === design.defaultVariantId);
  const colorId = defaultVariant?.colorId ?? design.colors[0]?.id ?? null;
  // Keep the shopper's size when switching designs, as long as the new design offers it in stock.
  const carried = design.sizes.find((size) => size.title === previousSize);
  const single = design.sizes.length === 1 ? design.sizes[0] : undefined;
  const candidate = carried ?? single;
  const sizeId =
    candidate &&
    design.variants.some((v) => v.colorId === colorId && v.sizeId === candidate.id && v.available)
      ? candidate.id
      : null;
  return { designId: design.id, colorId, sizeId, sizeTitle: previousSize ?? null, view: 0 };
}

export function ProductExperience({ category, designs, design }: Props) {
  const router = useRouter();
  const cart = useCart();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selection, setSelection] = useState(() => initialSelection(design));
  const [quantity, setQuantity] = useState(1);
  const [sizeWarning, setSizeWarning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);

  // A new design arrived from the server: reset the per-design selection during render.
  if (selection.designId !== design.id) {
    setSelection(initialSelection(design, selection.sizeTitle));
    setExpanded(false);
    setCheckoutError(null);
  }

  const { colorId, sizeId, view } = selection;
  const color = design.colors.find((c) => c.id === colorId) ?? null;
  const size = design.sizes.find((s) => s.id === sizeId) ?? null;

  const colorVariants = design.variants.filter((variant) => variant.colorId === colorId);
  const variant = colorVariants.find((v) => v.sizeId === sizeId && (design.sizes.length === 0 || sizeId != null));
  const needsSize = design.sizes.length > 0;
  const soldOut = !design.variants.some((v) => v.available);

  const images = design.images.filter((image) => colorId == null || image.colorIds.includes(colorId));
  const viewIndex = Math.min(view, Math.max(0, images.length - 1));
  const pendingDesign = isPending && pendingId && pendingId !== design.id ? designs.find((d) => d.id === pendingId) : null;
  const heroSrc = pendingDesign?.thumb ?? images[viewIndex]?.src ?? design.thumb;
  const selectedId = pendingDesign?.id ?? design.id;

  const availablePrices = colorVariants.filter((v) => v.available).map((v) => v.price);
  const minPrice = availablePrices.length ? Math.min(...availablePrices) : design.minPrice;
  const priceVaries = !variant && new Set(availablePrices).size > 1;
  const unitPrice = variant?.price ?? minPrice;

  useEffect(() => {
    // Keep the selected design visible in the carousel (e.g. when arriving via ?design=).
    const thumb = thumbsRef.current?.querySelector<HTMLElement>(`[data-id="${design.id}"]`);
    thumb?.scrollIntoView({ block: "nearest", inline: "center", behavior: "instant" as ScrollBehavior });
  }, [design.id]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setModalOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  const selectDesign = (id: string) => {
    setModalOpen(false);
    if (id === design.id && !pendingDesign) return;
    setPendingId(id);
    startTransition(() => router.replace(`/${category.slug}?design=${id}`, { scroll: false }));
  };

  const selectColor = (id: number) => {
    const keepSize = design.variants.some((v) => v.colorId === id && v.sizeId === sizeId && v.available);
    setSelection((s) => ({
      ...s,
      colorId: id,
      sizeId: keepSize ? s.sizeId : null,
      sizeTitle: keepSize ? s.sizeTitle : null,
      view: 0,
    }));
    setCheckoutError(null);
  };

  const selectSize = (id: number) => {
    const title = design.sizes.find((s) => s.id === id)?.title ?? null;
    setSelection((s) => ({ ...s, sizeId: id, sizeTitle: title }));
    setSizeWarning(false);
    setCheckoutError(null);
  };

  const showView = (index: number) =>
    setSelection((s) => ({ ...s, view: (index + images.length) % images.length }));

  const requireVariant = () => {
    if (!variant || !variant.available) {
      setSizeWarning(true);
      return null;
    }
    return variant;
  };

  const addToBag = () => {
    const chosen = requireVariant();
    if (!chosen) return;
    cart.add({
      productId: design.id,
      variantId: chosen.id,
      category: category.slug,
      name: design.name,
      color: color?.title ?? null,
      size: size?.title ?? null,
      image: images[0]?.src ?? design.thumb,
      unitPrice: chosen.price,
      quantity,
    });
  };

  const buyNow = async () => {
    const chosen = requireVariant();
    if (!chosen) return;
    setBuying(true);
    setCheckoutError(null);
    const message = await startCheckout([{ productId: design.id, variantId: chosen.id, quantity }]);
    if (message) {
      setCheckoutError(message);
      setBuying(false);
    }
  };

  const descriptionLong = design.description.join(" ").length > 180;

  return (
    <main className="detail-layout">
      <div className="detail-media">
        <div className="img-frame">
          <div className={`img-wrap ${isPending ? "loading" : ""}`}>
            <Image
              key={heroSrc}
              src={heroSrc}
              alt={`${design.name}${color ? ` — ${color.title}` : ""}`}
              fill
              sizes="(max-width: 720px) 100vw, 440px"
              priority
            />
            {isPending && <span className="img-spinner" aria-label="Loading design" />}
            {!pendingDesign && images.length > 1 && (
              <>
                <button className="view-arrow prev" type="button" aria-label="Previous view" onClick={() => showView(viewIndex - 1)}>
                  <ChevronLeft size={20} />
                </button>
                <button className="view-arrow next" type="button" aria-label="Next view" onClick={() => showView(viewIndex + 1)}>
                  <ChevronRight size={20} />
                </button>
                <div className="view-dots" role="tablist" aria-label="Product views">
                  {images.map((image, index) => (
                    <button
                      key={image.src}
                      type="button"
                      role="tab"
                      aria-selected={index === viewIndex}
                      aria-label={`View ${index + 1}: ${image.position}`}
                      className={index === viewIndex ? "active" : ""}
                      onClick={() => showView(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <span className="badge">New Drop</span>
        </div>

        {designs.length > 1 && (
          <div className="options">
            <div className="thumbs-row">
              <button
                className="thumb-arrow"
                type="button"
                aria-label="Previous designs"
                onClick={() => thumbsRef.current?.scrollBy({ left: -260, behavior: "smooth" })}
              >
                <ChevronLeft size={18} />
              </button>
              <div className="thumbs" ref={thumbsRef}>
                {designs.map((option) => (
                  <DesignThumb key={option.id} design={option} selected={option.id === selectedId} onSelect={selectDesign} />
                ))}
              </div>
              <button
                className="thumb-arrow"
                type="button"
                aria-label="More designs"
                onClick={() => thumbsRef.current?.scrollBy({ left: 260, behavior: "smooth" })}
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <button className="view-all" type="button" onClick={() => setModalOpen(true)}>
              View all {designs.length} options
            </button>
          </div>
        )}
      </div>

      <div className="detail-info">
        <div>
          <h1>Premium Indiana Wear</h1>
        </div>

        <div>
          <div className="price-row">
            <span className="price">
              {priceVaries && <small className="price-from">From </small>}
              {formatPrice(unitPrice)}
            </span>
            <span className="price-note">Printed to order · Ships in 3–5 days</span>
          </div>
          <p className="option-label" aria-live="polite">
            Selected: {(pendingDesign ?? design).name}
            {!pendingDesign && color ? ` — ${color.title}` : ""}
            {!pendingDesign && size ? ` / ${size.title}` : ""}
          </p>
        </div>

        <div className="divider" />

        {design.colors.length > 1 && (
          <div>
            <p className="label">
              Color <span className="label-value">{color?.title}</span>
            </p>
            <div className="swatches">
              {design.colors.map((option) => {
                const inStock = design.variants.some((v) => v.colorId === option.id && v.available);
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`swatch-btn ${option.id === colorId ? "selected" : ""}`}
                    style={{ background: option.hex ?? "#ccc" }}
                    aria-pressed={option.id === colorId}
                    aria-label={inStock ? option.title : `${option.title} — sold out`}
                    title={inStock ? option.title : `${option.title} — sold out`}
                    disabled={!inStock}
                    onClick={() => selectColor(option.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {needsSize && (
          <div>
            <p className="label">Select size</p>
            <div className="size-grid">
              {design.sizes.map((option) => {
                const match = colorVariants.find((v) => v.sizeId === option.id);
                const inStock = !!match?.available;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`size-btn ${option.id === sizeId ? "selected" : ""}`}
                    aria-pressed={option.id === sizeId}
                    disabled={!inStock}
                    title={inStock ? option.title : `${option.title} — unavailable${color ? ` in ${color.title}` : ""}`}
                    onClick={() => selectSize(option.id)}
                  >
                    {option.title}
                  </button>
                );
              })}
            </div>
            {sizeWarning && (
              <p className="size-warning" role="alert">
                Please select a size
              </p>
            )}
          </div>
        )}

        <div>
          <p className="label">Quantity</p>
          <div className="quantity-selector">
            <button
              className="qty-btn"
              type="button"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => q - 1)}
            >
              −
            </button>
            <div className="qty-value" aria-live="polite">
              {quantity}
            </div>
            <button
              className="qty-btn"
              type="button"
              aria-label="Increase quantity"
              disabled={quantity >= MAX_QUANTITY}
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </button>
          </div>
        </div>

        <div className="cta-row">
          <button className="buy-btn" type="button" onClick={buyNow} disabled={soldOut || buying || isPending}>
            {soldOut ? (
              "Sold out"
            ) : buying ? (
              <>
                <span className="spinner" />
                Redirecting to checkout…
              </>
            ) : (
              <>
                Buy Now — {priceVaries ? "from " : ""}
                {formatPrice(unitPrice * quantity)}
              </>
            )}
          </button>
          <button
            className="bag-btn"
            type="button"
            onClick={addToBag}
            disabled={soldOut || isPending}
            aria-label="Add to bag"
            title="Add to bag"
          >
            <ShoppingBag size={20} />
          </button>
          {checkoutError && (
            <p className="checkout-error" role="alert">
              {checkoutError}
            </p>
          )}
        </div>

        <div className="trust">
          <span className="trust-item">
            <ShieldCheck size={16} /> Secure Stripe checkout
          </span>
          <span className="trust-item">
            <ArrowRight size={16} /> Ships in 3–5 days
          </span>
        </div>

        <div className="divider" />

        {design.description.length > 0 && (
          <div className={`detail-description ${descriptionLong && !expanded ? "clamped" : ""}`}>
            {design.description.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}
        {descriptionLong && (
          <button className="read-more" type="button" onClick={() => setExpanded((open) => !open)}>
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      {modalOpen && (
        <div
          className="options-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`All ${designs.length} options`}
          onClick={(event) => event.target === event.currentTarget && setModalOpen(false)}
        >
          <div className="modal-inner">
            <div className="modal-head">
              <span>All {designs.length} options</span>
              <button className="modal-close" type="button" aria-label="Close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-grid">
              {designs.map((option) => (
                <DesignThumb key={option.id} design={option} selected={option.id === selectedId} onSelect={selectDesign} large />
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function DesignThumb({
  design,
  selected,
  onSelect,
  large,
}: {
  design: DesignSummary;
  selected: boolean;
  onSelect: (id: string) => void;
  large?: boolean;
}) {
  return (
    <button
      type="button"
      className={`thumb ${selected ? "selected" : ""}`}
      data-id={design.id}
      title={design.name}
      aria-label={design.name}
      aria-pressed={selected}
      onClick={() => onSelect(design.id)}
    >
      <Image src={design.thumb} alt="" width={large ? 180 : 84} height={large ? 180 : 84} sizes={large ? "180px" : "84px"} loading="lazy" />
      {large && <span className="thumb-name">{design.name}</span>}
    </button>
  );
}
