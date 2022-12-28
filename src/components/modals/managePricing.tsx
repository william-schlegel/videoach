import {
  useForm,
  type SubmitHandler,
  type SubmitErrorHandler,
  useWatch,
  type UseFormRegister,
  type FieldErrorsImpl,
} from "react-hook-form";
import Modal, { type TModalVariant } from "../ui/modal";
import {
  type Dispatch,
  type SetStateAction,
  useRef,
  useState,
  type PropsWithoutRef,
} from "react";
import Confirmation from "@ui/confirmation";
import { useTranslation } from "next-i18next";
import { trpc } from "@trpcclient/trpc";
import Spinner from "@ui/spinner";
import { Role } from "@prisma/client";
import { ROLE_LIST } from "@root/src/pages/user/[userId]";
import ButtonIcon from "@ui/buttonIcon";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
// import Toast from "@ui/toast";

type PricingFormValues = {
  title: string;
  description: string;
  roleTarget: Role;
  free?: boolean;
  highlighted?: boolean;
  monthly?: number;
  yearly?: number;
};

type CreatePricingProps = {
  variant?: TModalVariant;
};

export const CreatePricing = ({ variant = "Primary" }: CreatePricingProps) => {
  const { t } = useTranslation("admin");
  const utils = trpc.useContext();
  const [options, setOptions] = useState<string[]>([]);
  const createPricing = trpc.pricings.createPricing.useMutation({
    onSuccess: () => {
      utils.pricings.getAllPricing.invalidate();
      reset();
    },
  });
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<PricingFormValues>();
  const free = useWatch({
    control,
    name: "free",
    defaultValue: false,
  });

  const onSubmit: SubmitHandler<PricingFormValues> = (data) => {
    console.log("data", data);
    createPricing.mutate({
      base: {
        ...data,
        monthly: Number(data.monthly),
        yearly: Number(data.yearly),
      },
      options,
    });
  };

  const onError: SubmitErrorHandler<PricingFormValues> = (errors) => {
    console.log("errors :>> ", errors);
  };

  return (
    <Modal
      title={t("pricing.new-pricing")}
      buttonIcon={<i className="bx bx-plus bx-sm" />}
      variant={variant}
      className="w-10/12 max-w-3xl"
      handleSubmit={handleSubmit(onSubmit, onError)}
    >
      <h3>{t("pricing.new-pricing")}</h3>
      <PricingForm
        free={free ?? false}
        options={options}
        setOptions={setOptions}
        register={register}
        errors={errors}
      />
    </Modal>
  );
};

type PropsUpdateDelete = {
  pricingId: string;
  variant?: TModalVariant;
};

export const UpdatePricing = ({
  pricingId,
  variant = "Primary",
}: PropsUpdateDelete) => {
  const { t } = useTranslation("admin");
  const utils = trpc.useContext();
  const [options, setOptions] = useState<string[]>([]);
  const queryPricing = trpc.pricings.getPricingById.useQuery(pricingId ?? "", {
    onSuccess: (data) => {
      reset({
        title: data?.title,
        description: data?.description,
        free: data?.free ?? false,
        highlighted: data?.highlighted ?? false,
        monthly: Number(data?.monthly?.toFixed(2) ?? 0),
        yearly: Number(data?.yearly?.toFixed(2) ?? 0),
        roleTarget: data?.roleTarget,
      });
      setOptions(data?.options?.map((o) => o.name) ?? []);
    },
  });
  const updatePricing = trpc.pricings.updatePricing.useMutation({
    onSuccess: () => {
      utils.pricings.getPricingById.invalidate(pricingId);
      reset();
    },
  });
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<PricingFormValues>();
  const free = useWatch({
    control,
    name: "free",
    defaultValue: false,
  });

  const onSubmit: SubmitHandler<PricingFormValues> = (data) => {
    console.log("data", data);
    updatePricing.mutate({
      base: {
        id: pricingId,
        ...data,
        monthly: Number(data.monthly),
        yearly: Number(data.yearly),
      },
      options,
    });
  };

  const onError: SubmitErrorHandler<PricingFormValues> = (errors) => {
    console.log("errors :>> ", errors);
  };

  return (
    <>
      <Modal
        title={t("pricing.update-pricing")}
        handleSubmit={handleSubmit(onSubmit, onError)}
        buttonIcon={<i className="bx bx-edit bx-sm" />}
        variant={variant}
        className="w-10/12 max-w-3xl"
      >
        <h3>{t("pricing.update-pricing")}</h3>
        {queryPricing.isLoading ? (
          <Spinner />
        ) : (
          <PricingForm
            free={free ?? false}
            options={options}
            setOptions={setOptions}
            register={register}
            errors={errors}
          />
        )}
      </Modal>
    </>
  );
};

export const DeletePricing = ({
  pricingId,
  variant = "Outlined-Secondary",
}: PropsWithoutRef<PropsUpdateDelete>) => {
  const utils = trpc.useContext();
  const { t } = useTranslation("admin");

  const deletePricing = trpc.pricings.deletePricing.useMutation({
    onSuccess: () => {
      utils.pricings.getPricingById.invalidate(pricingId);
      utils.pricings.getAllPricing.invalidate();
    },
  });

  return (
    <Confirmation
      message={t("pricing.deletion-message")}
      title={t("pricing.deletion")}
      buttonIcon={<i className="bx bx-trash bx-sm" />}
      onConfirm={() => {
        deletePricing.mutate(pricingId);
      }}
      variant={variant}
    />
  );
};

export const UndeletePricing = ({
  pricingId,
  variant = "Outlined-Secondary",
}: PropsWithoutRef<PropsUpdateDelete>) => {
  const utils = trpc.useContext();
  const { t } = useTranslation("admin");

  const undeletePricing = trpc.pricings.undeletePricing.useMutation({
    onSuccess: () => {
      utils.pricings.getPricingById.invalidate(pricingId);
      utils.pricings.getAllPricing.invalidate();
    },
  });

  return (
    <Confirmation
      message={t("pricing.undelete-message")}
      title={t("pricing.undelete")}
      buttonIcon={<i className="bx bx-undo bx-sm" />}
      onConfirm={() => {
        undeletePricing.mutate(pricingId);
      }}
      variant={variant}
    />
  );
};

type PricingFormProps = {
  options: string[];
  setOptions: Dispatch<SetStateAction<string[]>>;
  register: UseFormRegister<PricingFormValues>;
  free: boolean;
  errors: FieldErrorsImpl<PricingFormValues>;
};

function PricingForm({
  options,
  setOptions,
  register,
  free,
  errors,
}: PricingFormProps): JSX.Element {
  const { t } = useTranslation("admin");
  const refOpt = useRef<HTMLInputElement>(null);
  const deletePricingOption = trpc.pricings.deletePricingOption.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setOptions((items) => {
        const oldIndex = items.indexOf(active.id.toString());
        const newIndex = items.indexOf(over?.id?.toString() ?? "");

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  // const onError: SubmitErrorHandler<PricingFormValues> = (errors) => {
  //   console.log("errors :>> ", errors);
  //   // {errors ? <Toast message={"Erreur création"} variant="Toast-Error" /> : null}
  // };

  function handleDeleteOption(idx: number) {
    deletePricingOption.mutate(options[idx] ?? "");
    const opts = options.filter((_, i) => i !== idx);
    setOptions([...opts]);
  }

  function addOption(option?: string) {
    if (!option) return;
    const opts = options;
    opts.push(option);
    setOptions([...opts]);
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <form className={`grid grid-cols-[auto_1fr] gap-2`}>
        <label>{t("pricing.name")}</label>
        <div className="flex flex-col gap-2">
          <input
            {...register("title", {
              required: t("pricing.name-mandatory"),
            })}
            type={"text"}
          />
          {errors.title ? (
            <p className="text-sm text-error">{errors.title.message}</p>
          ) : null}
        </div>
        <label>{t("pricing.description")}</label>
        <div className="flex flex-col gap-2">
          <textarea
            className="textarea-bordered textarea"
            {...register("description", {
              required: t("pricing.description-mandatory"),
            })}
            rows={3}
          />
          {errors.description ? (
            <p className="text-sm text-error">{errors.description.message}</p>
          ) : null}
        </div>
        <label>{t("pricing.role")}</label>
        <select
          className="select-bordered select w-full max-w-xs"
          {...register("roleTarget")}
          defaultValue={Role.MANAGER}
        >
          {ROLE_LIST.filter((rl) => rl.value !== Role.ADMIN).map((rl) => (
            <option key={rl.value} value={rl.value}>
              {t(`auth:${rl.label}`)}
            </option>
          ))}
        </select>
        <div className="form-control col-span-2">
          <label className="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              className="checkbox-primary checkbox"
              {...register("free")}
              defaultChecked={false}
            />
            <span className="label-text">{t("pricing.free")}</span>
          </label>
        </div>
        {free ? null : (
          <>
            <label>{t("pricing.monthly")}</label>
            <label className="input-group">
              <input {...register("monthly")} type={"number"} />
              <span>{t("pricing.euro-per-month")}</span>
            </label>
            <label>{t("pricing.yearly")}</label>
            <label className="input-group">
              <input {...register("yearly")} type={"number"} />
              <span>{t("pricing.euro-per-year")}</span>
            </label>
          </>
        )}

        <div className="form-control col-span-2">
          <label className="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              className="checkbox-primary checkbox"
              {...register("highlighted")}
              defaultChecked={false}
            />
            <span className="label-text">{t("pricing.highlighted")}</span>
          </label>
        </div>
      </form>
      <div className="flex flex-col gap-4">
        <label>{t("pricing.options")}</label>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={options}
            strategy={verticalListSortingStrategy}
          >
            <ul className="rounded border border-base-content border-opacity-20 p-2">
              {options.map((option, idx) => (
                <Option
                  key={idx}
                  option={option}
                  idx={idx}
                  onDelete={handleDeleteOption}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        <div className="flex items-center gap-2">
          <input
            type={"text"}
            ref={refOpt}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addOption(e.currentTarget.value);
                e.currentTarget.value = "";
              }
              if (e.key === "Escape") {
                e.currentTarget.value = "";
              }
            }}
          />
          <button
            onClick={() => {
              if (!refOpt.current) return;
              addOption(refOpt.current.value);
              refOpt.current.value = "";
            }}
          >
            <ButtonIcon
              iconComponent={<i className="bx bx-plus bx-sm" />}
              title={t("pricing.add-option")}
              buttonVariant="Icon-Outlined-Primary"
              buttonSize="md"
            />
          </button>
        </div>
      </div>
    </div>
  );
}

type OptionProps = {
  option: string;
  idx: number;
  onDelete: (idx: number) => void;
};

const Option = ({ option, idx, onDelete }: OptionProps) => {
  const { t } = useTranslation("admin");
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: option });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="my-2 flex items-center justify-between gap-4 border border-base-300 bg-base-100 p-2"
    >
      <div className="flex items-center gap-2">
        <i className="bx bx-menu bx-sm text-base-300" />
        <span>{option}</span>
      </div>
      <button onClick={() => onDelete(idx)}>
        <ButtonIcon
          iconComponent={<i className="bx bx-trash bx-xs" />}
          title={t("pricing.delete-option")}
          buttonVariant="Icon-Outlined-Secondary"
          buttonSize="sm"
        />
      </button>
    </li>
  );
};
