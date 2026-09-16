import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { resolveContourRole, canManagePropertyPhotos } from "@/lib/authorization";
import { smartCache } from "@/lib/cache";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const property = await db.property.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        photos: true,
        featuredPhoto: true,
        assignedAgentId: true,
        organizationId: true,
      },
    });

    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      photos: property.photos || [],
      featuredPhoto: property.featuredPhoto,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await getTenantContext(req);
    if (!tenant) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const property = await db.property.findFirst({
      where: { id, organizationId: tenant.organizationId },
      select: {
        id: true,
        title: true,
        photos: true,
        featuredPhoto: true,
        assignedAgentId: true,
        createdById: true,
      },
    });

    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    const role = resolveContourRole(
      tenant.session?.user?.role ?? undefined,
      "member",
      tenant.userRole === "SUPER_ADMIN" ? "OWNER" : undefined
    );

    const canUpload = canManagePropertyPhotos(
      { id: tenant.userId, role: tenant.userRole, contourRole: role },
      property
    );

    if (!canUpload) {
      return NextResponse.json(
        {
          success: false,
          error: "Field agents can only add photos to their assigned properties. Management can update any property.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const newPhotos: string[] = Array.isArray(body.photos) ? body.photos : body.photoUrl ? [body.photoUrl] : [];

    if (newPhotos.length === 0) {
      return NextResponse.json({ success: false, error: "No photo URLs provided to add." }, { status: 400 });
    }

    const currentPhotos = Array.isArray(property.photos) ? property.photos : [];
    const combinedPhotos = Array.from(new Set([...currentPhotos, ...newPhotos]));
    const featuredPhoto = body.featuredPhoto || property.featuredPhoto || combinedPhotos[0];

    const updated = await db.property.update({
      where: { id },
      data: {
        photos: combinedPhotos,
        featuredPhoto,
      },
    });

    // Invalidate caches
    smartCache.invalidateTag(tenant.organizationId, "properties", "/dashboard/properties");

    return NextResponse.json({
      success: true,
      photos: updated.photos,
      featuredPhoto: updated.featuredPhoto,
      message: "Photos updated successfully.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await getTenantContext(req);
    if (!tenant) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const property = await db.property.findFirst({
      where: { id, organizationId: tenant.organizationId },
      select: {
        id: true,
        title: true,
        photos: true,
        featuredPhoto: true,
        assignedAgentId: true,
        createdById: true,
      },
    });

    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    const role = resolveContourRole(
      tenant.session?.user?.role ?? undefined,
      "member",
      tenant.userRole === "SUPER_ADMIN" ? "OWNER" : undefined
    );

    const canUpload = canManagePropertyPhotos(
      { id: tenant.userId, role: tenant.userRole, contourRole: role },
      property
    );

    if (!canUpload) {
      return NextResponse.json(
        {
          success: false,
          error: "Field agents can only modify photos on their assigned properties. Management can update any property.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const photoUrl = searchParams.get("url");

    if (!photoUrl) {
      return NextResponse.json({ success: false, error: "Photo URL is required." }, { status: 400 });
    }

    const currentPhotos = Array.isArray(property.photos) ? property.photos : [];
    if (currentPhotos.length <= 1) {
      return NextResponse.json(
        { success: false, error: "A property listing must have at least one photo." },
        { status: 400 }
      );
    }

    const filteredPhotos = currentPhotos.filter((p) => p !== photoUrl);
    let newFeatured = property.featuredPhoto;
    if (property.featuredPhoto === photoUrl || !filteredPhotos.includes(property.featuredPhoto || "")) {
      newFeatured = filteredPhotos[0];
    }

    const updated = await db.property.update({
      where: { id },
      data: {
        photos: filteredPhotos,
        featuredPhoto: newFeatured,
      },
    });

    // Invalidate caches
    smartCache.invalidateTag(tenant.organizationId, "properties", "/dashboard/properties");

    return NextResponse.json({
      success: true,
      photos: updated.photos,
      featuredPhoto: updated.featuredPhoto,
      message: "Photo removed successfully.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
