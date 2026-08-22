"use client";

// ShadCn
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// Components
import {
    PdfViewer,
    BaseButton,
    NewInvoiceAlert,
    InvoiceLoaderModal,
    InvoiceExportModal,
} from "@/app/components";

// Contexts
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { useTranslationContext } from "@/contexts/TranslationContext";

// Hooks
import { useIsDesktop } from "@/hooks/useMediaQuery";

// Icons
import { FileInput, FolderUp, Import, Plus, RotateCcw } from "lucide-react";

const InvoiceActions = () => {
    const { invoicePdfLoading, newInvoice } = useInvoiceContext();

    const { _t } = useTranslationContext();

    /*
     * The preview is heavy (it renders the whole invoice template). Below xl it
     * lives in MobilePreviewSheet instead, so only mount it here once we know
     * we are actually on a desktop viewport — `hidden xl:block` alone would
     * still mount and re-render it on phones.
     */
    const isDesktop = useIsDesktop();

    return (
        <div className="min-w-0">
            <Card className="px-0 xl:sticky xl:top-24">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl md:text-2xl">
                        {_t("actions.title")}
                    </CardTitle>
                    <CardDescription>
                        {_t("actions.description")}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 px-4 sm:px-6">
                    {/* Primary action — hidden below xl, where MobileActionBar owns it */}
                    <BaseButton
                        type="submit"
                        tooltipLabel={_t("actions.generatePdfTooltip")}
                        loading={invoicePdfLoading}
                        loadingText={_t("actions.generatePdfLoading")}
                        className="hidden w-full xl:flex"
                        size="lg"
                    >
                        <FileInput />
                        {_t("actions.generatePdf")}
                    </BaseButton>

                    {/* Secondary invoice-management actions */}
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                        <InvoiceLoaderModal>
                            <BaseButton
                                variant="outline"
                                tooltipLabel={_t("actions.loadInvoiceTooltip")}
                                disabled={invoicePdfLoading}
                                className="w-full sm:w-auto"
                            >
                                <FolderUp />
                                {_t("actions.loadInvoice")}
                            </BaseButton>
                        </InvoiceLoaderModal>

                        <InvoiceExportModal>
                            <BaseButton
                                variant="outline"
                                tooltipLabel={_t("actions.exportInvoiceTooltip")}
                                disabled={invoicePdfLoading}
                                className="w-full sm:w-auto"
                            >
                                <Import />
                                {_t("actions.exportInvoice")}
                            </BaseButton>
                        </InvoiceExportModal>

                        <NewInvoiceAlert>
                            <BaseButton
                                variant="outline"
                                tooltipLabel={_t("actions.newInvoiceTooltip")}
                                disabled={invoicePdfLoading}
                                className="w-full sm:w-auto"
                            >
                                <Plus />
                                {_t("actions.newInvoice")}
                            </BaseButton>
                        </NewInvoiceAlert>

                        <NewInvoiceAlert
                            title={_t("actions.resetFormTitle")}
                            description={_t("actions.resetFormDescription")}
                            confirmLabel={_t("actions.resetFormConfirm")}
                            onConfirm={newInvoice}
                        >
                            <BaseButton
                                variant="ghost"
                                tooltipLabel={_t("actions.resetFormTooltip")}
                                disabled={invoicePdfLoading}
                                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
                            >
                                <RotateCcw />
                                {_t("actions.resetForm")}
                            </BaseButton>
                        </NewInvoiceAlert>
                    </div>

                    {/* Live preview / final PDF — desktop only */}
                    <div className="hidden xl:block">
                        <Separator className="my-4" />
                        {isDesktop ? (
                            <PdfViewer />
                        ) : (
                            <Skeleton className="min-h-[30rem] w-full rounded-xl" />
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default InvoiceActions;
