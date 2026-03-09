"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FINANCE_APPLICATION_TYPE_ORDER,
  type FinanceApplicationFormConfig,
  type FinanceFieldAutoValue,
  type FinanceFieldDataType,
  type FinanceFieldInputMode,
  type FinanceFieldWidgetType,
  type FinanceFormFieldConfig,
  type FinanceFormFieldOptionConfig,
} from "@/lib/finance-form-config";
import { APPLICATION_TYPES, type FinanceApplicationType } from "@/lib/finance-config";

type AdminConfigResponse = {
  applicationType: FinanceApplicationType;
  draft: FinanceApplicationFormConfig;
  published: FinanceApplicationFormConfig;
};

type EditorMode = "basic" | "advanced";

const DEFAULT_FIELD_DATA_TYPE: FinanceFieldDataType = "string";
const DEFAULT_FIELD_WIDGET_TYPE: FinanceFieldWidgetType = "input";
const DEFAULT_FIELD_INPUT_MODE: FinanceFieldInputMode = "text";

const DATA_TYPE_LABELS: Record<FinanceFieldDataType, string> = {
  int: "整数",
  float: "小数",
  string: "文本",
};

const WIDGET_TYPE_LABELS: Record<FinanceFieldWidgetType, string> = {
  input: "输入框",
  single_select: "单选",
  multi_select: "多选",
};

const INPUT_MODE_LABELS: Record<FinanceFieldInputMode, string> = {
  text: "单行文本",
  textarea: "多行文本",
  number: "数字输入",
  date: "日期选择",
  file: "附件上传",
  auto: "自动填充",
};

const AUTO_VALUE_LABELS: Record<FinanceFieldAutoValue, string> = {
  date: "当前日期",
  userName: "当前用户姓名",
};

const normalizeFieldsForCompare = (fields: FinanceFormFieldConfig[]) =>
  fields.map((field, index) => ({
    name: field.name.trim(),
    label: field.label.trim(),
    dataType: field.dataType,
    widgetType: field.widgetType,
    inputMode: field.inputMode,
    autoValue: field.autoValue,
    required: field.required,
    placeholder: field.placeholder || "",
    helpText: field.helpText || "",
    defaultValue: field.defaultValue || "",
    isActive: field.isActive,
    isSystemField: field.isSystemField,
    sortOrder: index,
    options: field.options.map((option, optionIndex) => ({
      value: option.value.trim(),
      label: option.label.trim(),
      isActive: option.isActive,
      sortOrder: optionIndex,
    })),
  }));

const toEditableFields = (fields: FinanceFormFieldConfig[]): FinanceFormFieldConfig[] =>
  fields.map((field) => ({
    ...field,
    options: field.options.map((option) => ({ ...option })),
  }));

const createFieldId = () => `field-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const createOptionId = () => `opt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const getFieldPreview = (field: FinanceFormFieldConfig) => {
  if (!field.isActive) {
    return "该字段已停用，不会在用户端展示";
  }

  if (field.widgetType === "single_select") {
    return `用户看到单选，下拉可选 ${field.options.filter((item) => item.isActive).length} 项`;
  }

  if (field.widgetType === "multi_select") {
    return `用户看到多选，可同时选择多个选项（当前可选 ${field.options.filter((item) => item.isActive).length} 项）`;
  }

  if (field.inputMode === "auto") {
    return `用户端自动填充：${field.autoValue ? AUTO_VALUE_LABELS[field.autoValue] : "未设置"}`;
  }

  return `用户手动填写：${INPUT_MODE_LABELS[field.inputMode]}`;
};

export default function FinanceAdminFormConfigPage() {
  const [activeType, setActiveType] = useState<FinanceApplicationType>(FINANCE_APPLICATION_TYPE_ORDER[0]);
  const [editorMode, setEditorMode] = useState<EditorMode>("basic");
  const [detailOpenMap, setDetailOpenMap] = useState<Record<string, boolean>>({});
  const [focusFieldId, setFocusFieldId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentConfig, setCurrentConfig] = useState<AdminConfigResponse | null>(null);
  const [editableFields, setEditableFields] = useState<FinanceFormFieldConfig[]>([]);
  const [initialFields, setInitialFields] = useState<FinanceFormFieldConfig[]>([]);

  const loadConfig = async (applicationType: FinanceApplicationType) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/finance/admin/form-config?applicationType=${applicationType}`);
      const result = (await res.json()) as {
        success?: boolean;
        data?: AdminConfigResponse;
        error?: string;
      };

      if (!res.ok || !result.success || !result.data) {
        throw new Error(result.error || "加载配置失败");
      }

      const draftFields = toEditableFields(result.data.draft.fields);
      setCurrentConfig(result.data);
      setEditableFields(draftFields);
      setInitialFields(toEditableFields(draftFields));
      setDetailOpenMap({});
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载配置失败");
      setCurrentConfig(null);
      setEditableFields([]);
      setInitialFields([]);
      setDetailOpenMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConfig(activeType);
  }, [activeType]);

  useEffect(() => {
    if (!focusFieldId) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const input = document.getElementById(`field-label-${focusFieldId}`) as HTMLInputElement | null;
      if (!input) {
        return;
      }

      input.focus();
      input.select();
      setFocusFieldId(null);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [focusFieldId, editableFields.length]);

  const hasUnsavedChanges = useMemo(() => {
    return (
      JSON.stringify(normalizeFieldsForCompare(editableFields)) !==
      JSON.stringify(normalizeFieldsForCompare(initialFields))
    );
  }, [editableFields, initialFields]);

  const toggleDetail = (fieldId: string) => {
    setDetailOpenMap((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };

  const addField = () => {
    const nextIndex = editableFields.length;
    const nextId = createFieldId();

    setEditableFields((prev) => [
      ...prev,
      {
        id: nextId,
        name: `customField_${nextIndex + 1}`,
        label: "",
        dataType: DEFAULT_FIELD_DATA_TYPE,
        widgetType: DEFAULT_FIELD_WIDGET_TYPE,
        inputMode: DEFAULT_FIELD_INPUT_MODE,
        autoValue: null,
        required: false,
        placeholder: null,
        helpText: null,
        defaultValue: null,
        sortOrder: nextIndex,
        isActive: true,
        isSystemField: false,
        options: [],
      },
    ]);

    setDetailOpenMap((prev) => ({ ...prev, [nextId]: true }));
    setFocusFieldId(nextId);
  };

  const updateField = (index: number, patch: Partial<FinanceFormFieldConfig>) => {
    setEditableFields((prev) =>
      prev.map((field, currentIndex) => (currentIndex === index ? { ...field, ...patch } : field)),
    );
  };

  const removeField = (index: number) => {
    setEditableFields((prev) => {
      if (prev.length <= 1) {
        alert("至少保留一个字段");
        return prev;
      }

      const next = prev.filter((_, currentIndex) => currentIndex !== index);
      return next;
    });
  };

  const addOption = (fieldIndex: number) => {
    setEditableFields((prev) =>
      prev.map((field, index) => {
        if (index !== fieldIndex) {
          return field;
        }

        return {
          ...field,
          options: [
            ...field.options,
            {
              id: createOptionId(),
              value: "",
              label: "",
              sortOrder: field.options.length,
              isActive: true,
            },
          ],
        };
      }),
    );
  };

  const updateOption = (fieldIndex: number, optionIndex: number, patch: Partial<FinanceFormFieldOptionConfig>) => {
    setEditableFields((prev) =>
      prev.map((field, currentFieldIndex) => {
        if (currentFieldIndex !== fieldIndex) {
          return field;
        }

        return {
          ...field,
          options: field.options.map((option, currentOptionIndex) =>
            currentOptionIndex === optionIndex ? { ...option, ...patch } : option,
          ),
        };
      }),
    );
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    setEditableFields((prev) =>
      prev.map((field, currentFieldIndex) => {
        if (currentFieldIndex !== fieldIndex) {
          return field;
        }

        if (field.options.length <= 1) {
          alert("至少保留一个选项");
          return field;
        }

        return {
          ...field,
          options: field.options.filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex),
        };
      }),
    );
  };

  const onWidgetTypeChange = (index: number, widgetType: FinanceFieldWidgetType) => {
    const field = editableFields[index];
    if (!field) {
      return;
    }

    if (widgetType === "input") {
      updateField(index, {
        widgetType,
        inputMode: field.inputMode === "auto" ? "auto" : field.inputMode,
      });
      return;
    }

    updateField(index, {
      widgetType,
      inputMode: "text",
      autoValue: null,
      options:
        field.options.length > 0
          ? field.options
          : [
              {
                id: createOptionId(),
                value: "",
                label: "",
                sortOrder: 0,
                isActive: true,
              },
            ],
    });
  };

  const saveDraft = async () => {
    setSaving(true);

    try {
      const payload = {
        fields: editableFields.map((field, index) => ({
          name: field.name,
          label: field.label,
          dataType: field.dataType,
          widgetType: field.widgetType,
          inputMode: field.inputMode,
          autoValue: field.autoValue,
          required: field.required,
          placeholder: field.placeholder,
          helpText: field.helpText,
          defaultValue: field.defaultValue,
          isActive: field.isActive,
          isSystemField: field.isSystemField,
          sortOrder: index,
          options: field.options.map((option, optionIndex) => ({
            value: option.value,
            label: option.label,
            isActive: option.isActive,
            sortOrder: optionIndex,
          })),
        })),
      };

      const res = await fetch(`/api/finance/admin/form-config?applicationType=${activeType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await res.json()) as {
        success?: boolean;
        data?: AdminConfigResponse;
        error?: string;
      };

      if (!res.ok || !result.success || !result.data) {
        throw new Error(result.error || "保存失败");
      }

      const draftFields = toEditableFields(result.data.draft.fields);
      setCurrentConfig(result.data);
      setEditableFields(draftFields);
      setInitialFields(toEditableFields(draftFields));
      alert("草稿已保存");
    } catch (saveError) {
      alert(saveError instanceof Error ? saveError.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setPublishing(true);

    try {
      if (hasUnsavedChanges) {
        await saveDraft();
      }

      const res = await fetch(`/api/finance/admin/form-config/publish?applicationType=${activeType}`, {
        method: "POST",
      });

      const result = (await res.json()) as {
        success?: boolean;
        data?: AdminConfigResponse;
        error?: string;
      };

      if (!res.ok || !result.success || !result.data) {
        throw new Error(result.error || "发布失败");
      }

      const draftFields = toEditableFields(result.data.draft.fields);
      setCurrentConfig(result.data);
      setEditableFields(draftFields);
      setInitialFields(toEditableFields(draftFields));
      alert("发布成功");
    } catch (publishError) {
      alert(publishError instanceof Error ? publishError.message : "发布失败");
    } finally {
      setPublishing(false);
    }
  };

  const cancelChanges = () => {
    setEditableFields(toEditableFields(initialFields));
    setDetailOpenMap({});
  };

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="space-y-2 px-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">表单配置</h1>
        <p className="text-sm text-muted-foreground">按申请类型维护用户提交时看到的字段，基础模式更适合业务同学。</p>
      </div>

      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="px-4 py-3 sm:px-5">
          <CardTitle className="text-base">申请类型</CardTitle>
          <CardDescription className="text-xs sm:text-sm">选择需要维护的申请类型模板。</CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            {FINANCE_APPLICATION_TYPE_ORDER.map((applicationType) => (
              <Button
                key={applicationType}
                type="button"
                variant={activeType === applicationType ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveType(applicationType)}
                className="h-8 rounded-lg px-3 text-xs"
              >
                {APPLICATION_TYPES[applicationType].label}
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="space-y-3 px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">字段配置</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {loading
                  ? "正在加载..."
                  : `草稿 v${currentConfig?.draft.version ?? "-"} / 已发布 v${currentConfig?.published.version ?? "-"}`}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addField}
              className="h-8 gap-1.5 rounded-lg text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              新增字段
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 p-2">
            <div className="text-xs text-muted-foreground">
              <p>基础模式：主要配置用户可见内容。高级模式：额外配置字段标识和默认值。</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={editorMode === "basic" ? "default" : "outline"}
                onClick={() => setEditorMode("basic")}
                className="h-7 rounded-md px-3 text-xs"
              >
                基础模式
              </Button>
              <Button
                type="button"
                size="sm"
                variant={editorMode === "advanced" ? "default" : "outline"}
                onClick={() => setEditorMode("advanced")}
                className="h-7 rounded-md px-3 text-xs"
              >
                高级模式
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 px-4 pb-4 pt-0 sm:px-5">
          {loading && <p className="text-sm text-muted-foreground">正在加载配置...</p>}
          {!loading && error && <p className="text-sm text-destructive">{error}</p>}

          {!loading && !error && editableFields.length === 0 && (
            <p className="text-sm text-muted-foreground">当前暂无字段，请新增后保存。</p>
          )}

          {!loading &&
            !error &&
            editableFields.map((field, fieldIndex) => {
              const isOptionField = field.widgetType === "single_select" || field.widgetType === "multi_select";
              const isInputField = field.widgetType === "input";
              const isAutoInput = isInputField && field.inputMode === "auto";
              const isFileInput = isInputField && field.inputMode === "file";
              const showDetails = editorMode === "advanced" || Boolean(detailOpenMap[field.id]);

              return (
                <div key={`${field.id}-${fieldIndex}`} className="space-y-3 rounded-xl border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">字段 {fieldIndex + 1}</p>
                    <div className="flex items-center gap-2">
                      {!field.isActive && <span className="rounded bg-muted px-2 py-0.5 text-[11px]">已停用</span>}
                      {field.isSystemField && (
                        <span className="rounded bg-muted px-2 py-0.5 text-[11px]">系统内置字段</span>
                      )}
                      {editorMode === "basic" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleDetail(field.id)}
                          className="h-7 rounded-md px-2 text-xs"
                        >
                          {showDetails ? "收起更多设置" : "更多设置"}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">字段名称（用户看到）</p>
                      <Input
                        id={`field-label-${field.id}`}
                        value={field.label}
                        onChange={(e) => updateField(fieldIndex, { label: e.target.value })}
                        placeholder="例如：申请日期"
                        className="h-9 border-border/60 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">展示方式</p>
                      <select
                        value={field.widgetType}
                        onChange={(e) => onWidgetTypeChange(fieldIndex, e.target.value as FinanceFieldWidgetType)}
                        className="h-9 w-full rounded-md border border-border/60 bg-background px-2.5 text-xs outline-none transition-colors focus:ring-1 focus:ring-ring"
                      >
                        {Object.entries(WIDGET_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">值类型</p>
                      <select
                        value={field.dataType}
                        onChange={(e) => updateField(fieldIndex, { dataType: e.target.value as FinanceFieldDataType })}
                        className="h-9 w-full rounded-md border border-border/60 bg-background px-2.5 text-xs outline-none transition-colors focus:ring-1 focus:ring-ring"
                      >
                        {Object.entries(DATA_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {isInputField && (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">输入样式</p>
                        <select
                          value={field.inputMode}
                          onChange={(e) =>
                            updateField(fieldIndex, { inputMode: e.target.value as FinanceFieldInputMode })
                          }
                          className="h-9 w-full rounded-md border border-border/60 bg-background px-2.5 text-xs outline-none transition-colors focus:ring-1 focus:ring-ring"
                        >
                          {Object.entries(INPUT_MODE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {isAutoInput && (
                        <div className="space-y-1">
                          <p className="text-[11px] text-muted-foreground">自动填充来源</p>
                          <select
                            value={field.autoValue || ""}
                            onChange={(e) =>
                              updateField(fieldIndex, {
                                autoValue: (e.target.value || null) as FinanceFieldAutoValue | null,
                              })
                            }
                            className="h-9 w-full rounded-md border border-border/60 bg-background px-2.5 text-xs outline-none transition-colors focus:ring-1 focus:ring-ring"
                          >
                            <option value="">请选择</option>
                            {Object.entries(AUTO_VALUE_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {showDetails && (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">字段标识（系统用）</p>
                        <Input
                          value={field.name}
                          onChange={(e) => updateField(fieldIndex, { name: e.target.value })}
                          placeholder="例如：createdAt"
                          className="h-9 border-border/60 text-xs"
                          disabled={field.isSystemField}
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">占位提示</p>
                        <Input
                          value={field.placeholder || ""}
                          onChange={(e) => updateField(fieldIndex, { placeholder: e.target.value || null })}
                          placeholder="例如：请输入内容"
                          className="h-9 border-border/60 text-xs"
                          disabled={!isInputField || isAutoInput || isFileInput}
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">默认值</p>
                        <Input
                          value={field.defaultValue || ""}
                          onChange={(e) => updateField(fieldIndex, { defaultValue: e.target.value || null })}
                          placeholder="可选"
                          className="h-9 border-border/60 text-xs"
                          disabled={!isInputField || isAutoInput || isFileInput}
                        />
                      </div>

                      <div className="space-y-1 md:col-span-3">
                        <p className="text-[11px] text-muted-foreground">帮助文案</p>
                        <Input
                          value={field.helpText || ""}
                          onChange={(e) => updateField(fieldIndex, { helpText: e.target.value || null })}
                          placeholder="例如：请按身份证姓名填写"
                          className="h-9 border-border/60 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <label className="inline-flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(fieldIndex, { required: e.target.checked })}
                      />
                      必填
                    </label>
                    <label className="inline-flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={field.isActive}
                        onChange={(e) => updateField(fieldIndex, { isActive: e.target.checked })}
                      />
                      启用
                    </label>
                    {editorMode === "advanced" && (
                      <label className="inline-flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={field.isSystemField}
                          onChange={(e) => updateField(fieldIndex, { isSystemField: e.target.checked })}
                        />
                        系统内置字段（不可删除）
                      </label>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeField(fieldIndex)}
                      className="h-7 rounded-md px-2 text-xs"
                      disabled={field.isSystemField}
                    >
                      删除字段
                    </Button>
                  </div>

                  {isOptionField && (
                    <div className="space-y-2 rounded-lg border border-dashed border-border/70 p-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">选项配置（用户可选项）</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => addOption(fieldIndex)}
                          className="h-7 rounded-md px-2 text-xs"
                        >
                          新增选项
                        </Button>
                      </div>

                      {editorMode === "basic" && (
                        <p className="text-[11px] text-muted-foreground">
                          基础模式下可只填选项名称，选项编码会自动生成。
                        </p>
                      )}

                      {field.options.map((option, optionIndex) => (
                        <div
                          key={`${option.id}-${optionIndex}`}
                          className={`grid grid-cols-1 gap-2 ${editorMode === "advanced" ? "md:grid-cols-[1fr_1fr_auto_auto]" : "md:grid-cols-[1fr_auto_auto]"}`}
                        >
                          <Input
                            value={option.label}
                            onChange={(e) => updateOption(fieldIndex, optionIndex, { label: e.target.value })}
                            placeholder="选项名称"
                            className="h-8 border-border/60 text-xs"
                          />

                          {editorMode === "advanced" && (
                            <Input
                              value={option.value}
                              onChange={(e) => updateOption(fieldIndex, optionIndex, { value: e.target.value })}
                              placeholder="选项编码"
                              className="h-8 border-border/60 text-xs"
                            />
                          )}

                          <select
                            value={option.isActive ? "active" : "inactive"}
                            onChange={(e) =>
                              updateOption(fieldIndex, optionIndex, {
                                isActive: e.target.value === "active",
                              })
                            }
                            className="h-8 rounded-md border border-border/60 bg-background px-2 text-xs"
                          >
                            <option value="active">启用</option>
                            <option value="inactive">停用</option>
                          </select>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => removeOption(fieldIndex, optionIndex)}
                            className="h-8 rounded-md px-2 text-xs"
                          >
                            删除
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                    <p className="text-[11px] text-muted-foreground">用户端预览</p>
                    <p className="text-xs">{getFieldPreview(field)}</p>
                  </div>
                </div>
              );
            })}

          {!loading && !error && (
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={cancelChanges}
                disabled={!hasUnsavedChanges || saving || publishing}
              >
                取消
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={saveDraft}
                disabled={saving || publishing || !hasUnsavedChanges}
                className="gap-1.5"
              >
                <Save className="h-4 w-4" />
                {saving ? "保存中..." : "保存草稿"}
              </Button>
              <Button type="button" onClick={publish} disabled={saving || publishing}>
                {publishing ? "发布中..." : "发布配置"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
