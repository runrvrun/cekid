import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";

type Params = { params: { permalink: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { permalink } = await params;
  const post = await prisma.ulasan.findUnique({
    where: { permalink, status: "PUBLISHED" },
    select: { title: true, metaDescription: true },
  });
  if (!post) return {};

  return {
    title: post.title,
    description: post.metaDescription ?? undefined,
    openGraph: {
      title: post.title,
      description: post.metaDescription ?? undefined,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: post.title,
      description: post.metaDescription ?? undefined,
    },
  };
}

export default async function UlasanPublicPage({ params }: Params) {
  const { permalink } = await params;

  const post = await prisma.ulasan.findUnique({
    where: { permalink, status: "PUBLISHED" },
    select: {
      title: true,
      content: true,
      publishedAt: true,
      author: { select: { name: true } },
    },
  });

  if (!post) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <article>
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
            {post.title}
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            {post.author?.name && (
              <span className="font-medium text-gray-500">{post.author.name}</span>
            )}
            {post.author?.name && post.publishedAt && (
              <span>&middot;</span>
            )}
            {post.publishedAt && (
              <time dateTime={post.publishedAt.toISOString()}>
                {new Date(post.publishedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            )}
          </div>
        </header>

        <div className="text-gray-700 leading-relaxed">
          <RenderContent content={post.content} />
        </div>
      </article>
    </div>
  );
}

type Segment =
  | { type: "html"; value: string }
  | { type: "shortcode"; slug: string };

function parseSegments(content: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /\[product slug=([^\]]+)\]/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > last) {
      segments.push({ type: "html", value: content.slice(last, match.index) });
    }
    segments.push({ type: "shortcode", slug: match[1].trim() });
    last = match.index + match[0].length;
  }
  if (last < content.length) {
    segments.push({ type: "html", value: content.slice(last) });
  }
  return segments;
}

async function RenderContent({ content }: { content: string }) {
  const segments = parseSegments(content);

  return (
    <>
      {await Promise.all(
        segments.map(async (seg, i) => {
          if (seg.type === "html") {
            return (
              <div
                key={i}
                className="ulasan-content"
                dangerouslySetInnerHTML={{ __html: seg.value }}
              />
            );
          }
          return <ProductSnippetCard key={i} slug={seg.slug} />;
        })
      )}
    </>
  );
}

async function ProductSnippetCard({ slug }: { slug: string }) {
  const product = await prisma.product.findUnique({
    where: { slug, deletedAt: null },
    select: {
      name: true,
      slug: true,
      rating: true,
      reviewCount: true,
      productImages: {
        where: { isMain: true },
        select: { url: true },
        take: 1,
      },
    },
  });

  if (!product) return null;

  const imageUrl = product.productImages[0]?.url ?? "/product-placeholder.svg";
  const rating = Number(product.rating ?? 0);
  const reviewCount = product.reviewCount ?? 0;

  return (
    <Link
      href={`/${product.slug}`}
      className="flex items-start gap-4 border border-gray-200 rounded-xl p-4 my-6 hover:border-gray-400 hover:shadow-sm transition-all group no-underline"
    >
      <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900 group-hover:underline truncate">
          {product.name}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <StarRow rating={rating} />
          <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
        </div>
        <p className="text-sm text-gray-400 mt-0.5">{reviewCount.toLocaleString("id-ID")} ulasan</p>
      </div>
    </Link>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${rating} dari 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className={`w-3.5 h-3.5 ${n <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}
